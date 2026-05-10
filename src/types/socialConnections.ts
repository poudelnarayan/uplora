import { z } from "zod";

/**
 * Social connections schema
 *
 * Why:
 * - `users.socialConnections` is a JSON column, so it can drift over time.
 * - Centralizing a tolerant schema prevents subtle breakage when adding fields.
 *
 * Design:
 * - Use `.passthrough()` so older/newer fields don't break parsing.
 * - Use `normalizeSocialConnections()` (non-throwing) in runtime paths.
 * - All datetime fields accept ISO with timezone offset (Postgres/Supabase
 *   default format `2026-04-19T18:10:14.956+00:00`). Strict `Z`-only parsing
 *   silently dropped every connection from the DB.
 */
const isoDatetime = () => z.string().datetime({ offset: true });

export const facebookConnectionSchema = z
  .object({
    connectedAt: isoDatetime().optional(),
    userId: z.union([z.string(), z.number()]).transform(String).optional(),
    userName: z.string().nullable().optional(),

    // Tokens (some older code used accessToken; new code prefers userAccessToken)
    userAccessToken: z.string().optional(),
    userTokenExpiresAt: isoDatetime().nullable().optional(),
    accessToken: z.string().optional(),

    // Page selection + token
    selectedPageId: z.string().nullable().optional(),
    selectedPageName: z.string().nullable().optional(),
    selectedPageAccessToken: z.string().optional(),

    // Instagram linkage via a Page
    instagramBusinessAccountId: z.string().nullable().optional(),

    // Sanitized pages list (no page token by default)
    pages: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string().nullable().optional(),
            hasPageToken: z.boolean().optional(),
            instagramBusinessAccountId: z.string().nullable().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

export const instagramConnectionSchema = z
  .object({
    connectedAt: isoDatetime().optional(),

    // IG Business Login flow fields
    instagramUserId: z.string().optional(),
    businessAccountId: z.string().nullable().optional(),
    accessToken: z.string().optional(),
    tokenExpiresAt: isoDatetime().nullable().optional(),

    // Older/FB-linkage fields (kept for compatibility)
    pageId: z.string().optional(),
  })
  .passthrough();

export const socialConnectionsSchema = z
  .object({
    facebook: facebookConnectionSchema.nullable().optional(),
    instagram: instagramConnectionSchema.nullable().optional(),
    telegram: z
      .object({
        connectedAt: isoDatetime().optional(),
        chatId: z.string().optional(),
        username: z.string().nullable().optional(),
        // One-time code used to link Telegram chat -> Uplora user (set by /api/telegram/connect)
        pendingCode: z.string().nullable().optional(),
        pendingExpiresAt: isoDatetime().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    youtube: z
      .object({
        connectedAt: isoDatetime().optional(),
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
        tokenExpiresAt: isoDatetime().nullable().optional(),
        scope: z.string().nullable().optional(),

        // Channel info (for nicer UI)
        channelId: z.string().nullable().optional(),
        channelTitle: z.string().nullable().optional(),
        subscriberCount: z.union([z.string(), z.number()]).transform((v) => String(v)).nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    twitter: z
      .object({
        connectedAt: isoDatetime().optional(),

        // Encrypted tokens
        encryptedAccessToken: z.string().optional(),
        encryptedRefreshToken: z.string().optional(),
        tokenExpiresAt: isoDatetime().nullable().optional(),

        // X user
        userId: z.string().nullable().optional(),
        username: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
        profileImageUrl: z.string().nullable().optional(),

        scope: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    linkedin: z
      .object({
        connectedAt: isoDatetime().optional(),
        accessToken: z.string().optional(),
        tokenExpiresAt: isoDatetime().nullable().optional(),

        // LinkedIn member id / author URN
        memberId: z.string().optional(),
        authorUrn: z.string().nullable().optional(),

        // Optional OIDC/userinfo details
        name: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        picture: z.string().nullable().optional(),

        scope: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    pinterest: z
      .object({
        connectedAt: isoDatetime().optional(),
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
        tokenExpiresAt: isoDatetime().nullable().optional(),
        refreshTokenExpiresAt: isoDatetime().nullable().optional(),
        scope: z.string().nullable().optional(),

        // Basic profile
        username: z.string().nullable().optional(),
        profileImage: z.string().nullable().optional(),
        accountType: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    threads: z
      .object({
        connectedAt: isoDatetime().optional(),
        accessToken: z.string().optional(),
        tokenExpiresAt: isoDatetime().nullable().optional(),
        threadsUserId: z.string().optional(),
        scope: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    tiktok: z
      .object({
        connectedAt: isoDatetime().optional(),

        // TikTok OAuth tokens
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
        tokenExpiresAt: isoDatetime().nullable().optional(),
        refreshTokenExpiresAt: isoDatetime().nullable().optional(),

        // TikTok user profile
        openId: z.string().optional(),
        unionId: z.string().optional(),
        username: z.string().nullable().optional(),
        displayName: z.string().nullable().optional(),
        avatarUrl: z.string().nullable().optional(),

        // Scopes we obtained
        scope: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export type SocialConnections = z.infer<typeof socialConnectionsSchema>;

/**
 * Non-throwing normalization for runtime use.
 * Returns a safe object even if the DB contains unexpected shapes.
 */
export function normalizeSocialConnections(input: unknown): SocialConnections {
  const res = socialConnectionsSchema.safeParse(input ?? {});
  if (res.success) return res.data;
  return {};
}


