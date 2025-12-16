import crypto from "node:crypto";
import { decryptString, encryptString } from "@/lib/tokenCrypto";

/**
 * X (Twitter) OAuth2 + PKCE helpers.
 *
 * OAuth:
 * - Authorize: https://twitter.com/i/oauth2/authorize
 * - Token:     https://api.twitter.com/2/oauth2/token
 * - Revoke:    https://api.twitter.com/2/oauth2/revoke (best-effort)
 *
 * API v2:
 * - Me:        GET https://api.twitter.com/2/users/me?user.fields=profile_image_url
 * - Tweet:     POST https://api.twitter.com/2/tweets
 */

function base64Url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  // RFC 7636: verifier length 43-128 chars. Use 32 bytes => 43 chars base64url.
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  return { codeVerifier: verifier, codeChallenge: challenge };
}

export function buildXAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scope: string; // space-separated
}): string {
  const url = new URL("https://twitter.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  // ensure refresh_token is returned when offline.access is requested
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

function basicAuth(clientId: string, clientSecret: string) {
  const raw = `${clientId}:${clientSecret}`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}

function nowPlusSeconds(seconds?: number): string | null {
  if (typeof seconds !== "number") return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function jsonOrText(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await res.json().catch(() => null);
  return await res.text().catch(() => "");
}

export async function exchangeXCodeForTokens(input: {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{
  encryptedAccessToken: string;
  encryptedRefreshToken: string | null;
  tokenExpiresAt: string | null;
  scope?: string;
}> {
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: basicAuth(input.clientId, input.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
    }),
  });

  const json: any = await jsonOrText(res);
  if (!res.ok) throw new Error(`X token exchange HTTP ${res.status}: ${JSON.stringify(json)}`);
  if (!json?.access_token) throw new Error(`X token exchange missing access_token: ${JSON.stringify(json)}`);

  const expiresIn = typeof json?.expires_in === "number" ? json.expires_in : undefined;
  const refreshToken = typeof json?.refresh_token === "string" ? json.refresh_token : null;

  return {
    encryptedAccessToken: encryptString(String(json.access_token)),
    encryptedRefreshToken: refreshToken ? encryptString(refreshToken) : null,
    tokenExpiresAt: nowPlusSeconds(expiresIn),
    scope: typeof json?.scope === "string" ? json.scope : undefined,
  };
}

export async function refreshXAccessToken(input: {
  encryptedRefreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{
  encryptedAccessToken: string;
  encryptedRefreshToken: string | null;
  tokenExpiresAt: string | null;
  scope?: string;
}> {
  const refreshToken = decryptString(input.encryptedRefreshToken);
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: basicAuth(input.clientId, input.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const json: any = await jsonOrText(res);
  if (!res.ok) throw new Error(`X token refresh HTTP ${res.status}: ${JSON.stringify(json)}`);
  if (!json?.access_token) throw new Error(`X refresh missing access_token: ${JSON.stringify(json)}`);

  const expiresIn = typeof json?.expires_in === "number" ? json.expires_in : undefined;
  const newRefreshToken = typeof json?.refresh_token === "string" ? json.refresh_token : null;

  return {
    encryptedAccessToken: encryptString(String(json.access_token)),
    encryptedRefreshToken: newRefreshToken ? encryptString(newRefreshToken) : null,
    tokenExpiresAt: nowPlusSeconds(expiresIn),
    scope: typeof json?.scope === "string" ? json.scope : undefined,
  };
}

export async function revokeXToken(input: {
  token: string; // plaintext token
  tokenTypeHint?: "access_token" | "refresh_token";
  clientId: string;
  clientSecret: string;
}): Promise<void> {
  // Best-effort: X supports oauth2/revoke; failures shouldn't block disconnect.
  const res = await fetch("https://api.twitter.com/2/oauth2/revoke", {
    method: "POST",
    headers: {
      Authorization: basicAuth(input.clientId, input.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: input.token,
      token_type_hint: input.tokenTypeHint || "access_token",
    }),
  });
  if (!res.ok) {
    const body = await jsonOrText(res);
    throw new Error(`X revoke failed HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
}

export async function fetchXMe(encryptedAccessToken: string): Promise<{
  userId: string;
  username?: string | null;
  name?: string | null;
  profileImageUrl?: string | null;
}> {
  const accessToken = decryptString(encryptedAccessToken);
  const url = new URL("https://api.twitter.com/2/users/me");
  url.searchParams.set("user.fields", "profile_image_url");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json: any = await jsonOrText(res);
  if (!res.ok) throw new Error(`X /users/me HTTP ${res.status}: ${JSON.stringify(json)}`);
  const data = json?.data;
  if (!data?.id) throw new Error(`X /users/me missing id: ${JSON.stringify(json)}`);
  return {
    userId: String(data.id),
    username: data.username ?? null,
    name: data.name ?? null,
    profileImageUrl: data.profile_image_url ?? null,
  };
}

export async function postTweet(encryptedAccessToken: string, text: string): Promise<any> {
  const accessToken = decryptString(encryptedAccessToken);
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const json: any = await jsonOrText(res);
  if (!res.ok) throw new Error(`X tweet HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}


