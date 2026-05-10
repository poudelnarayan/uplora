# AI Integration Plan (post-MVP)

This document is the implementation path for the AI assist features advertised on `/subscription`. Build it after Stripe billing is fully wired so plan-gating works on day one.

## Features (in build order)

| # | Feature | UI surface | Model |
|---|---|---|---|
| 1 | **Rewrite title** | ✨ button next to Title field on make-post/video, /text, /reel | Claude Sonnet 4.6 |
| 2 | **Suggest tags** | ✨ button next to Tags field on make-post/video | Claude Sonnet 4.6 |
| 3 | **Generate cover image** | ✨ button on Thumbnail upload area on make-post/video, /image, /reel | FAL.ai or Replicate (Flux Schnell) |
| 4 (later) | Caption rewriter for short-form (IG/Threads) | ✨ button on caption textarea on make-post/reel | Claude Haiku 4.5 |
| 5 (later) | Hashtag analyzer for trending | inline panel on Tags input | Claude + cached web fetch |

## Pricing model — credits per billing cycle

Defined already in `src/stripe-config.ts`:

| Plan | Title rewrites | Tag suggestions | Cover images |
|---|---|---|---|
| Free | 0 | 0 | 0 |
| Creator | 100 / mo | 100 / mo | 20 / mo |
| Team | 500 / mo | 500 / mo | 100 / mo |

A "credit" = 1 successful generation. Each kind has its own bucket so a user heavy on titles doesn't burn their thumbnail allowance.

## Data model

Reuse the existing `usage_counters` table. Add a row per user per billing period:

```sql
-- Migration: extend usage_counters with AI credit columns
ALTER TABLE usage_counters
  ADD COLUMN IF NOT EXISTS ai_title_credits_used INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_tag_credits_used INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_thumbnail_credits_used INT NOT NULL DEFAULT 0;
```

Reset on Stripe `invoice.paid` webhook (already handled — extend the existing webhook to write a fresh counter row scoped to the new period_start/period_end).

## Routes (add under `/api/ai/`)

### `POST /api/ai/rewrite-title`
**Body:** `{ current: string, description?: string, platform?: "youtube" | "instagram" | ... }`
**Returns:** `{ title: string, alternatives: string[] }` (4 variants)
**Cost:** 1 credit from `ai_title_credits_used`

### `POST /api/ai/rewrite-tags`
**Body:** `{ title: string, description?: string, platform?: string }`
**Returns:** `{ tags: string[] }` (10–15 tags)
**Cost:** 1 credit from `ai_tag_credits_used`

### `POST /api/ai/generate-thumbnail`
**Body:** `{ title: string, description?: string, style?: "photo" | "illustration" | "minimal" }`
**Returns:** `{ jobId: string }` — async, client polls or subscribes
**Cost:** 1 credit from `ai_thumbnail_credits_used`

### `GET /api/ai/usage`
**Returns:** current credits used + limit + reset date — for showing in UI

## Shared middleware

Create `src/server/services/aiCredits.ts`:

```ts
export async function consumeCredit(
  userId: string,
  kind: "title" | "tag" | "thumbnail"
): Promise<{ allowed: true } | { allowed: false; reason: "no_plan" | "exhausted"; planRequired?: PlanId }> {
  // 1. Look up active plan via stripe_subscriptions
  // 2. Look up current usage_counters row for this billing period
  // 3. Compare used vs plan limit
  // 4. If allowed: increment used, return allowed
  // 5. If exhausted: return {allowed:false, reason:"exhausted"}
}
```

Every route calls this first, returns `402 Payment Required` if not allowed.

## Server-side prompts (use these as-is)

### Title rewriter — `src/server/ai/prompts/title.ts`

```ts
export function titleRewritePrompt(current: string, description: string, platform: string) {
  return `You are a YouTube/social SEO expert. Rewrite this title to maximize click-through rate while staying truthful.

CURRENT TITLE: ${current}
DESCRIPTION: ${description.slice(0, 500)}
PLATFORM: ${platform}

Constraints:
- ${platform === "youtube" ? "60 characters max" : "platform-appropriate length"}
- No clickbait or false promises
- Lead with the strongest hook
- Avoid generic words ("amazing", "incredible") unless specific

Return exactly 4 variants in JSON: {"variants": ["...", "...", "...", "..."]}`;
}
```

### Tag generator — `src/server/ai/prompts/tags.ts`

```ts
export function tagGenerationPrompt(title: string, description: string, platform: string) {
  return `Generate ${platform === "youtube" ? "10-15" : "5-10"} relevant tags for this content. Tags must be short (1-3 words), lowercase, no '#' prefix, comma-friendly.

TITLE: ${title}
DESCRIPTION: ${description.slice(0, 500)}
PLATFORM: ${platform}

Return JSON: {"tags": ["tag1", "tag2", ...]}`;
}
```

### Thumbnail prompt builder — `src/server/ai/prompts/thumbnail.ts`

```ts
export function thumbnailPrompt(title: string, description: string, style: string) {
  const styleLine = {
    photo: "Photorealistic, vibrant colors, dramatic lighting",
    illustration: "Bold flat illustration, high contrast, simple shapes",
    minimal: "Clean minimal design, single focal subject, lots of negative space",
  }[style] || "Eye-catching, bold composition, YouTube-thumbnail style";

  return `${title}. ${description.slice(0, 200)}. ${styleLine}. 16:9 aspect ratio, no text overlay.`;
}
```

## Client UX

```tsx
// On make-post/video, next to Title input:
<div className="flex items-center gap-2">
  <Input value={title} onChange={...} />
  <AIButton
    kind="title"
    onGenerate={async () => {
      const r = await fetch("/api/ai/rewrite-title", {
        method: "POST",
        body: JSON.stringify({ current: title, description, platform: "youtube" }),
      });
      if (r.status === 402) {
        // open upgrade modal
        return;
      }
      const { variants } = await r.json();
      // show inline picker: 4 chips, click to apply
    }}
  />
</div>
```

`AIButton` shows:
- Default: ✨ icon + "Rewrite with AI" label, opacity 70%
- Hover: full opacity, 1px ring
- Loading: spinner + "Generating…"
- Out of credits: locked appearance + "Upgrade for more"

## Cost estimates (Anthropic pricing as of build)

- Claude Sonnet 4.6: ~$3 input / $15 output per 1M tokens
- Average title rewrite: ~500 input + 200 output tokens = $0.0045 per call
- 100 calls/mo per Creator user = $0.45/mo COGS — pricing has 40× margin
- Thumbnail: Flux Schnell ~$0.003 per image; 20/mo = $0.06 — even better margin

So Creator at $19 has ~$0.50 of monthly AI COGS, Team at $49 has ~$3 — very healthy.

## Rollout phases

1. **Week 1**: extend `usage_counters` migration + `consumeCredit` helper + `/api/ai/usage`
2. **Week 2**: ship `/api/ai/rewrite-title` + AIButton + plug into make-post/video Title field
3. **Week 3**: ship `/api/ai/rewrite-tags` + plug into Tags field
4. **Week 4**: ship `/api/ai/generate-thumbnail` (async w/ webhook) + plug into Thumbnail upload area
5. **Week 5**: add usage indicator to /subscription page ("84/100 title credits used this month")

## Things to skip for MVP

- Streaming responses (just return JSON when done)
- Multi-platform variants in one call (keep it 1 call = 1 platform)
- Image-to-image refinement on covers (1 generation per credit, no iteration)
- User-level prompt customization (locked prompts for now)
