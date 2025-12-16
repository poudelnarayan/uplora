import { getUserSocialConnections, updateUserSocialConnections } from "@/server/services/socialConnections";
import { refreshPinterestAccessToken } from "@/lib/pinterest";

/**
 * Pinterest token service:
 * - reads stored tokens from socialConnections
 * - refreshes access token when expired (best-effort)
 */

export async function getValidPinterestAccessToken(userId: string): Promise<string> {
  const social = await getUserSocialConnections(userId);
  const p = social.pinterest;

  if (!p?.accessToken || !p?.refreshToken) {
    throw new Error("Pinterest not connected");
  }

  const isExpired =
    !!p.tokenExpiresAt && Date.parse(p.tokenExpiresAt) <= Date.now() + 60_000; // 1 min skew

  if (!isExpired) return p.accessToken;

  const clientId =
    process.env.PINTEREST_APP_ID ||
    process.env.PINTEREST_CLIENT_ID ||
    process.env.PINTEREST_CLIENT_KEY;
  const clientSecret = process.env.PINTEREST_SECRET_KEY || process.env.PINTEREST_APP_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Pinterest client not configured");
  }

  const refreshed = await refreshPinterestAccessToken({
    refreshToken: p.refreshToken,
    clientId,
    clientSecret,
  });

  await updateUserSocialConnections(userId, current => ({
    ...current,
    pinterest: {
      ...(current.pinterest || {}),
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      tokenExpiresAt: refreshed.tokenExpiresAt,
      refreshTokenExpiresAt: refreshed.refreshTokenExpiresAt,
      scope: refreshed.scope ?? current.pinterest?.scope ?? null,
    },
  }));

  return refreshed.accessToken;
}


