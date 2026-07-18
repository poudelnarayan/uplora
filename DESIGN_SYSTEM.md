# Uplora Design System

**Intent:** a structured, tokenized, content-first UI for a YouTube team-workflow
product — light-first marketing, professional dark mode in-app, WCAG 2.2 AA.

This replaces `COLOR_SYSTEM.md`. Tokens live in `src/app/globals.css`; platform
metadata lives in `src/config/platforms.ts`. Components consume both — never
raw hex, never inline platform lists.

---

## 1. Foundations

### Color tokens (semantic, HSL triplets consumed via Tailwind)

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` / `foreground` | white / near-black | zinc-950 / near-white | page base |
| `card` | white | zinc-900 | raised surfaces |
| `primary` | deep green `152 55% 30%` | green `152 50% 45%` | CTAs, active nav, links |
| `primary-foreground` | white | near-black green | text on primary |
| `secondary`, `muted` | zinc-100 | zinc-800/850 | wells, chips |
| `muted-foreground` | `240 4% 38%` (≈6.5:1) | `240 5% 65%` (≈7:1) | secondary text |
| `warning` | amber-700 | amber-400 | caution states |
| `destructive` | red `0 72% 42%` | red `0 70% 55%` | delete, errors |
| `success` | = primary family | = primary family | success states |
| `border` / `input` / `ring` | zinc-200 / primary | zinc-800 / primary | lines, focus |

**Platform brand colors** (YouTube red etc.) come from `src/config/platforms.ts`
(`iconBg`/`iconFg`) — the one sanctioned exception to semantic-only color.
Tailwind `red-600` is allowed solely for YouTube branding.

### Typography
- Family: **Plus Jakarta Sans** via `--font-sans` (weights 400–800). No serif.
- Scale: Tailwind defaults (`text-xs` 12 → `text-4xl` 36) — matches the token
  spec exactly. Utilities `.heading-1…4` for marketing headlines.
- Body: 15px mobile / 16px ≥1024px, line-height 1.5.

### Space, radius, motion
- Spacing: Tailwind 4-px scale; no one-off pixel values.
- Radius: `--radius: 0.5rem`; cards `rounded-2xl` (16px), pills `rounded-full`.
- Motion: 150/200/300ms tokens (`--transition-*`); `prefers-reduced-motion`
  collapses all animation. No idle animation loops in the app shell.

---

## 2. Component state rules

Every interactive component must define: default, hover, focus-visible,
active, disabled, loading, error.

- **Buttons** — primary: `bg-primary text-primary-foreground hover:bg-primary-hover`;
  outline: `border-border hover:bg-muted`; destructive: `bg-destructive`.
  Disabled = 50% opacity + `pointer-events-none`. Loading = spinner + label,
  never a bare spinner. Min touch target 40px.
- **Links** — `text-primary` with underline on hover; never color-only in body
  copy without underline affordance.
- **Cards** — `bg-card border-border rounded-2xl`; hover raises with
  `shadow-medium`, never scale >1.02.
- **Inputs** — `border-input bg-background`; error = `border-destructive` +
  message under field (`text-destructive text-sm`); never placeholder-only labels.
- **Empty states** — icon + one sentence + one action. Long content: truncate
  with `truncate`/`line-clamp-*` inside `min-w-0` containers; tables scroll in
  their own `overflow-x-auto`.

### Focus (non-negotiable)
Global `:focus-visible` outline (2px, `--ring`, offset 2) is defined in
`globals.css`. Components must not remove it. Keyboard order must follow
visual order; all pointer actions must be reachable by keyboard.

---

## 3. Accessibility acceptance criteria (testable)

1. Every text/surface pair ships ≥4.5:1 (normal) or ≥3:1 (≥24px bold) — check
   with a contrast tool against the token values above. **Pass/fail.**
2. Tab through any screen: every interactive element shows the ring outline.
   **Pass/fail.**
3. No information conveyed by color alone (status always has icon or label).
   **Pass/fail.**
4. `prefers-reduced-motion` disables all animation. **Pass/fail.**
5. All icons that act as buttons have `aria-label`. **Pass/fail.**

---

## 4. Anti-patterns (prohibited)

- ❌ Per-page theme override layers (`.theme-landing` is dead — it caused
  white-on-white fallthrough bugs; do not reintroduce).
- ❌ Raw hex/rgb in components (exception: none — even YouTube red goes
  through `platforms.ts` or `red-600`).
- ❌ `text-white` on token surfaces (use `text-primary-foreground` etc. so
  dark mode stays correct).
- ❌ Neon glows, colored box-shadows on neutral surfaces, gradient text on
  low-contrast backgrounds.
- ❌ Hardcoded plan/pricing data in components — import from
  `src/stripe-config.ts`.
- ❌ Inline platform lists — iterate `enabledPlatforms()` from
  `src/config/platforms.ts`.

---

## 5. QA checklist (run before shipping UI)

- [ ] Light + dark render checked (`html.dark` toggled).
- [ ] Contrast criteria (§3.1) spot-checked on new text/surface pairs.
- [ ] Keyboard pass (§3.2) on every new interactive element.
- [ ] Mobile 375px: no horizontal scroll, touch targets ≥40px.
- [ ] Empty, loading, and error states implemented — not just the happy path.
- [ ] No new hex values, no new one-off spacing.
- [ ] `npx tsc --noEmit` and `next build` green.
