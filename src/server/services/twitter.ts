import { decryptString } from "@/lib/tokenCrypto";
import { refreshXAccessToken } from "@/lib/twitter";
import { getUserSocialConnections, updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * X token service:
 * - reads stored encrypted tokens
 * - refreshes when expired using refresh_token
 */
export async function getValidXEncryptedAccessToken(userId: string): Promise<string> {
  const social = await getUserSocialConnections(userId);
  const tw = social.twitter;
  if (!tw?.encryptedAccessToken) throw new Error("X not connected");

  const isExpired =
    !!tw.tokenExpiresAt && Date.parse(tw.tokenExpiresAt) <= Date.now() + 60_000; // 1 min skew

  if (!isExpired) return tw.encryptedAccessToken;

  if (!tw.encryptedRefreshToken) throw new Error("X refresh token missing (reconnect required)");

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("X client not configured");

  const refreshed = await refreshXAccessToken({
    encryptedRefreshToken: tw.encryptedRefreshToken,
    clientId,
    clientSecret,
  });

  await updateUserSocialConnections(userId, current => ({
    ...current,
    twitter: {
      ...(current.twitter || {}),
      encryptedAccessToken: refreshed.encryptedAccessToken,
      encryptedRefreshToken: refreshed.encryptedRefreshToken || current.twitter?.encryptedRefreshToken,
      tokenExpiresAt: refreshed.tokenExpiresAt,
      scope: refreshed.scope ?? current.twitter?.scope ?? null,
    },
  }));

  return refreshed.encryptedAccessToken;
}

export function decryptXToken(encrypted: string) {
  return decryptString(encrypted);
}


