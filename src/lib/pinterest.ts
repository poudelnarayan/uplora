/**
 * Pinterest API helper module (pure functions; no Next.js route handlers).
 *
 * OAuth:
 * - Authorize: https://www.pinterest.com/oauth/
 * - Token/Refresh: POST https://api.pinterest.com/v5/oauth/token
 *
 * API v5:
 * - User:   GET https://api.pinterest.com/v5/user_account
 * - Boards: GET https://api.pinterest.com/v5/boards
 * - Pins:   POST https://api.pinterest.com/v5/pins
 */

export class PinterestApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  retryAfterSeconds?: number;

  constructor(message: string, opts?: { status?: number; code?: string; details?: unknown; retryAfterSeconds?: number }) {
    super(message);
    this.name = "PinterestApiError";
    this.status = opts?.status;
    this.code = opts?.code;
    this.details = opts?.details;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
  }
}

function nowPlusSeconds(seconds?: number): string | null {
  if (typeof seconds !== "number") return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function buildPinterestAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope: string; // comma-separated: "boards:read,pins:read,pins:write"
}): string {
  const url = new URL("https://www.pinterest.com/oauth/");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  return url.toString();
}

function basicAuth(clientId: string, clientSecret: string) {
  // Node/Edge-safe base64
  const raw = `${clientId}:${clientSecret}`;
  const b64 = Buffer.from(raw, "utf8").toString("base64");
  return `Basic ${b64}`;
}

async function parseJsonSafely(res: Response) {
  return await res.json().catch(() => null);
}

async function ensureOk(res: Response) {
  if (res.ok) return;
  const retryAfter = res.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;
  const body = await parseJsonSafely(res);
  throw new PinterestApiError(`Pinterest API HTTP ${res.status}`, {
    status: res.status,
    details: body,
    retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
  });
}

export async function exchangePinterestCodeForTokens(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  scope?: string;
}> {
  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: basicAuth(input.clientId, input.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
  });

  await ensureOk(res);
  const json: any = await res.json();

  const accessToken = json?.access_token;
  const refreshToken = json?.refresh_token;
  const expiresIn = typeof json?.expires_in === "number" ? json.expires_in : undefined;
  const refreshExpiresIn = typeof json?.refresh_token_expires_in === "number" ? json.refresh_token_expires_in : undefined;

  if (!accessToken || !refreshToken) {
    throw new PinterestApiError("Pinterest token exchange missing fields", { details: json });
  }

  return {
    accessToken: String(accessToken),
    refreshToken: String(refreshToken),
    tokenExpiresAt: nowPlusSeconds(expiresIn),
    refreshTokenExpiresAt: nowPlusSeconds(refreshExpiresIn),
    scope: typeof json?.scope === "string" ? json.scope : undefined,
  };
}

export async function refreshPinterestAccessToken(input: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  scope?: string;
}> {
  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: basicAuth(input.clientId, input.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: input.refreshToken,
    }),
  });

  await ensureOk(res);
  const json: any = await res.json();

  const accessToken = json?.access_token;
  const refreshToken = json?.refresh_token || input.refreshToken;
  const expiresIn = typeof json?.expires_in === "number" ? json.expires_in : undefined;
  const refreshExpiresIn = typeof json?.refresh_token_expires_in === "number" ? json.refresh_token_expires_in : undefined;

  if (!accessToken) {
    throw new PinterestApiError("Pinterest refresh missing access_token", { details: json });
  }

  return {
    accessToken: String(accessToken),
    refreshToken: String(refreshToken),
    tokenExpiresAt: nowPlusSeconds(expiresIn),
    refreshTokenExpiresAt: nowPlusSeconds(refreshExpiresIn),
    scope: typeof json?.scope === "string" ? json.scope : undefined,
  };
}

async function pinterestApiRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = new URL(`https://api.pinterest.com${path}`);
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  // Rate limit / invalid token handling
  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;
    const body = await parseJsonSafely(res);
    throw new PinterestApiError("Pinterest rate limited", {
      status: 429,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
      details: body,
    });
  }

  await ensureOk(res);
  return (await res.json()) as T;
}

export async function getPinterestUser(accessToken: string): Promise<any> {
  return await pinterestApiRequest(accessToken, "/v5/user_account", { method: "GET" });
}

export async function getPinterestBoards(accessToken: string): Promise<any> {
  return await pinterestApiRequest(accessToken, "/v5/boards", { method: "GET" });
}

/**
 * Create an Image Pin by URL.
 *
 * NOTE: Pinterest supports URL-based media sources for some pin types.
 * If your Pinterest app requires media uploads, you can extend this to use the media upload APIs.
 */
export async function createImagePin(
  accessToken: string,
  input: { boardId: string; title: string; description?: string; imageUrl: string }
): Promise<any> {
  return await pinterestApiRequest(accessToken, "/v5/pins", {
    method: "POST",
    body: JSON.stringify({
      board_id: input.boardId,
      title: input.title,
      description: input.description || "",
      media_source: {
        source_type: "image_url",
        url: input.imageUrl,
      },
    }),
  });
}

/**
 * Create a Video Pin by URL.
 *
 * NOTE: Some Pinterest accounts/apps require using the media upload flow for videos.
 * This implementation uses URL-based video source (if supported by your app/account).
 */
export async function createVideoPin(
  accessToken: string,
  input: { boardId: string; title: string; description?: string; videoUrl: string }
): Promise<any> {
  return await pinterestApiRequest(accessToken, "/v5/pins", {
    method: "POST",
    body: JSON.stringify({
      board_id: input.boardId,
      title: input.title,
      description: input.description || "",
      media_source: {
        source_type: "video_url",
        url: input.videoUrl,
      },
    }),
  });
}


