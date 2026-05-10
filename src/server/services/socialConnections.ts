import { supabaseAdmin } from "@/lib/supabase";
import { normalizeSocialConnections, type SocialConnections } from "@/types/socialConnections";

/**
 * Social connections service — backed by the `social_accounts` table.
 *
 * `social_accounts` rows are team-scoped.  When no teamId is given we use the
 * user's personal team (identified by teams.is_personal = true).
 *
 * Column mapping (social_accounts → SocialConnections field):
 *   platform              → key in SocialConnections
 *   access_token          → primary token (encrypted for Twitter)
 *   refresh_token         → refresh token
 *   token_expires_at      → tokenExpiresAt
 *   scopes[]              → scope (joined as string)
 *   external_account_id   → platform user/channel id
 *   display_name          → username / channel title
 *   avatar_url            → profile image
 *   profile_url           → secondary id (e.g. authorUrn for LinkedIn,
 *                           selectedPageId for Facebook)
 */

/**
 * Resolve a Clerk user ID to the internal users.id (UUID).
 * Returns null if the user row doesn't exist yet.
 */
async function getInternalUserId(clerkUserId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Get the personal team ID for a Clerk user.
 * teams.owner_id stores the internal users.id UUID, not the Clerk ID.
 *
 * Includes a fallback for "phantom" teams created by old code that stored the
 * Clerk ID directly in owner_id. If a phantom is found it is migrated in-place
 * to use the correct internal UUID so subsequent calls take the fast path.
 */
async function getPersonalTeamId(clerkUserId: string): Promise<string | null> {
  const internalId = await getInternalUserId(clerkUserId);
  if (!internalId) return null;

  // Primary path: owner_id holds the correct internal UUID
  const { data } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('owner_id', internalId)
    .eq('is_personal', true)
    .maybeSingle();

  if (data?.id) return data.id;

  // Fallback: old code stored the Clerk ID directly in owner_id ("phantom team")
  const { data: phantom } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('owner_id', clerkUserId)
    .eq('is_personal', true)
    .maybeSingle();

  if (phantom?.id) {
    // Migrate the phantom team: fix owner_id to the correct internal UUID
    await supabaseAdmin
      .from('teams')
      .update({ owner_id: internalId, updated_at: new Date().toISOString() })
      .eq('id', phantom.id);
    return phantom.id;
  }

  return null;
}

function rowsToConnections(rows: any[]): SocialConnections {
  const result: Record<string, any> = {};

  for (const row of rows) {
    if (row.revoked_at) continue;

    const platform = row.platform as string;
    const base = {
      connectedAt: row.created_at,
      accessToken: row.access_token,
      refreshToken: row.refresh_token ?? undefined,
      tokenExpiresAt: row.token_expires_at ?? null,
      scope: row.scopes?.join(' ') ?? null,
    };

    switch (platform) {
      case 'youtube':
        result.youtube = {
          ...base,
          channelId: row.external_account_id ?? null,
          channelTitle: row.display_name ?? null,
        };
        break;

      case 'twitter':
        result.twitter = {
          connectedAt: row.created_at,
          encryptedAccessToken: row.access_token,
          encryptedRefreshToken: row.refresh_token ?? undefined,
          tokenExpiresAt: row.token_expires_at ?? null,
          userId: row.external_account_id ?? null,
          username: row.display_name ?? null,
          profileImageUrl: row.avatar_url ?? null,
          scope: row.scopes?.join(' ') ?? null,
        };
        break;

      case 'facebook':
        result.facebook = {
          connectedAt: row.created_at,
          userId: row.external_account_id ?? undefined,
          userAccessToken: row.access_token,
          selectedPageId: row.profile_url ?? null,
          selectedPageName: row.display_name ?? null,
          instagramBusinessAccountId: row.avatar_url ?? null,
        };
        break;

      case 'instagram':
        result.instagram = {
          connectedAt: row.created_at,
          businessAccountId: row.external_account_id ?? null,
          instagramUserId: row.external_account_id ?? undefined,
          accessToken: row.access_token,
          tokenExpiresAt: row.token_expires_at ?? null,
          pageId: row.profile_url ?? undefined,
        };
        break;

      case 'linkedin':
        result.linkedin = {
          ...base,
          memberId: row.external_account_id ?? undefined,
          authorUrn: row.profile_url ?? null,
          name: row.display_name ?? null,
          picture: row.avatar_url ?? null,
        };
        break;

      case 'pinterest':
        result.pinterest = {
          ...base,
          username: row.display_name ?? null,
          profileImage: row.avatar_url ?? null,
        };
        break;

      case 'threads':
        result.threads = {
          connectedAt: row.created_at,
          accessToken: row.access_token,
          tokenExpiresAt: row.token_expires_at ?? null,
          threadsUserId: row.external_account_id ?? undefined,
          scope: row.scopes?.join(' ') ?? null,
        };
        break;

      case 'tiktok':
        result.tiktok = {
          connectedAt: row.created_at,
          accessToken: row.access_token,
          refreshToken: row.refresh_token ?? undefined,
          tokenExpiresAt: row.token_expires_at ?? null,
          openId: row.external_account_id ?? undefined,
          displayName: row.display_name ?? null,
          avatarUrl: row.avatar_url ?? null,
          scope: row.scopes?.join(' ') ?? null,
        };
        break;

      case 'telegram':
        result.telegram = {
          connectedAt: row.created_at,
          chatId: row.external_account_id ?? undefined,
          username: row.display_name ?? null,
          pendingCode: row.access_token || undefined,
          pendingExpiresAt: row.token_expires_at ?? null,
        };
        break;

      default:
        result[platform] = base;
    }
  }

  return normalizeSocialConnections(result);
}

function connectionToRow(
  teamId: string,
  userId: string,
  platform: string,
  conn: any
): Record<string, any> {
  const now = new Date().toISOString();

  const base: Record<string, any> = {
    team_id: teamId,
    platform,
    connected_by_user_id: userId,
    updated_at: now,
  };

  switch (platform) {
    case 'youtube':
      return {
        ...base,
        external_account_id: conn.channelId ?? null,
        display_name: conn.channelTitle ?? null,
        access_token: conn.accessToken ?? '',
        refresh_token: conn.refreshToken ?? null,
        token_expires_at: conn.tokenExpiresAt ?? null,
        scopes: conn.scope ? conn.scope.split(' ') : null,
      };

    case 'twitter':
      return {
        ...base,
        external_account_id: conn.userId ?? null,
        display_name: conn.username ?? null,
        avatar_url: conn.profileImageUrl ?? null,
        access_token: conn.encryptedAccessToken ?? '',
        refresh_token: conn.encryptedRefreshToken ?? null,
        token_expires_at: conn.tokenExpiresAt ?? null,
        scopes: conn.scope ? conn.scope.split(' ') : null,
      };

    case 'facebook':
      return {
        ...base,
        external_account_id: conn.userId ?? null,
        display_name: conn.selectedPageName ?? conn.userName ?? null,
        access_token: conn.selectedPageAccessToken || conn.userAccessToken || conn.accessToken || '',
        profile_url: conn.selectedPageId ?? null,
        avatar_url: conn.instagramBusinessAccountId ?? null,
      };

    case 'instagram':
      return {
        ...base,
        external_account_id: conn.businessAccountId ?? conn.instagramUserId ?? null,
        access_token: conn.accessToken ?? '',
        token_expires_at: conn.tokenExpiresAt ?? null,
        profile_url: conn.pageId ?? null,
      };

    case 'linkedin':
      return {
        ...base,
        external_account_id: conn.memberId ?? null,
        display_name: conn.name ?? null,
        avatar_url: conn.picture ?? null,
        access_token: conn.accessToken ?? '',
        token_expires_at: conn.tokenExpiresAt ?? null,
        profile_url: conn.authorUrn ?? null,
        scopes: conn.scope ? conn.scope.split(' ') : null,
      };

    case 'pinterest':
      return {
        ...base,
        external_account_id: conn.username ?? null,
        display_name: conn.username ?? null,
        avatar_url: conn.profileImage ?? null,
        access_token: conn.accessToken ?? '',
        refresh_token: conn.refreshToken ?? null,
        token_expires_at: conn.tokenExpiresAt ?? null,
        scopes: conn.scope ? conn.scope.split(' ') : null,
      };

    case 'threads':
      return {
        ...base,
        external_account_id: conn.threadsUserId ?? null,
        access_token: conn.accessToken ?? '',
        token_expires_at: conn.tokenExpiresAt ?? null,
        scopes: conn.scope ? conn.scope.split(' ') : null,
      };

    case 'tiktok':
      return {
        ...base,
        external_account_id: conn.openId ?? null,
        display_name: conn.displayName ?? null,
        avatar_url: conn.avatarUrl ?? null,
        access_token: conn.accessToken ?? '',
        refresh_token: conn.refreshToken ?? null,
        token_expires_at: conn.tokenExpiresAt ?? null,
        scopes: conn.scope ? conn.scope.split(' ') : null,
      };

    case 'telegram':
      return {
        ...base,
        external_account_id: conn.chatId ?? null,
        display_name: conn.username ?? null,
        access_token: conn.pendingCode ?? '',
        token_expires_at: conn.pendingExpiresAt ?? null,
      };

    default:
      return {
        ...base,
        access_token: conn.accessToken ?? '',
        refresh_token: conn.refreshToken ?? null,
        token_expires_at: conn.tokenExpiresAt ?? null,
      };
  }
}

export async function getUserSocialConnections(
  userId: string,
  teamId?: string
): Promise<SocialConnections> {
  const resolvedTeamId = teamId ?? (await getPersonalTeamId(userId));
  if (!resolvedTeamId) return normalizeSocialConnections({});

  const { data, error } = await supabaseAdmin
    .from('social_accounts')
    .select('*')
    .eq('team_id', resolvedTeamId)
    .is('revoked_at', null);

  if (error) throw error;
  return rowsToConnections(data || []);
}

export async function updateUserSocialConnections(
  userId: string,
  updater: (current: SocialConnections) => SocialConnections,
  teamId?: string
): Promise<SocialConnections> {
  const resolvedTeamId = teamId ?? (await getPersonalTeamId(userId));

  if (!resolvedTeamId) {
    // ensurePersonalTeam expects the internal UUID, not the Clerk ID
    const internalId = await getInternalUserId(userId);
    if (!internalId) throw new Error(`No user row found for clerk_id=${userId}`);
    const { ensurePersonalTeam } = await import("@/lib/clerk-supabase-utils");
    const newTeamId = await ensurePersonalTeam(internalId);
    return updateUserSocialConnections(userId, updater, newTeamId);
  }

  const current = await getUserSocialConnections(userId, resolvedTeamId);
  const next = updater(current);

  const platforms = ['youtube', 'twitter', 'facebook', 'instagram', 'linkedin',
    'pinterest', 'threads', 'tiktok', 'telegram'] as const;

  for (const platform of platforms) {
    const nextConn = (next as any)[platform];
    const currentConn = (current as any)[platform];

    // null/undefined in `next` while `current` had a value → disconnect.
    // Without this, calling updater that sets `platform: null` was a no-op
    // and disconnect routes silently left the row active.
    if (!nextConn) {
      if (currentConn) {
        await disconnectPlatform(userId, platform, resolvedTeamId);
      }
      continue;
    }

    const row = connectionToRow(resolvedTeamId, userId, platform, nextConn);

    const { data: existing } = await supabaseAdmin
      .from('social_accounts')
      .select('id')
      .eq('team_id', resolvedTeamId)
      .eq('platform', platform)
      .is('revoked_at', null)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('social_accounts')
        .update({ ...row, last_refreshed_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('social_accounts')
        .insert({ ...row, created_at: new Date().toISOString() });
    }
  }

  return next;
}

export async function clearFacebookInstagramConnections(userId: string, teamId?: string) {
  const resolvedTeamId = teamId ?? (await getPersonalTeamId(userId));
  if (!resolvedTeamId) return;

  const now = new Date().toISOString();
  await supabaseAdmin
    .from('social_accounts')
    .update({ revoked_at: now, updated_at: now })
    .eq('team_id', resolvedTeamId)
    .in('platform', ['facebook', 'instagram']);
}

export async function disconnectPlatform(userId: string, platform: string, teamId?: string) {
  const resolvedTeamId = teamId ?? (await getPersonalTeamId(userId));
  if (!resolvedTeamId) return;

  const now = new Date().toISOString();
  await supabaseAdmin
    .from('social_accounts')
    .update({ revoked_at: now, updated_at: now })
    .eq('team_id', resolvedTeamId)
    .eq('platform', platform)
    .is('revoked_at', null);
}
