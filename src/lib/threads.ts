/**
 * Threads API helper module (pure functions).
 *
 * OAuth:
 * - Authorize: https://www.threads.com/oauth/authorize
 * - Token:     https://graph.threads.net/oauth/access_token
 *
 * Publish (two-step):
 * - Create:    POST https://graph.threads.net/v1.0/{threads_user_id}/threads
 * - Publish:   POST https://graph.threads.net/v1.0/{threads_user_id}/threads_publish
 */

export function buildThreadsAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope: string; // "threads_basic,threads_content_publish"
}): string {
  const url = new URL("https://www.threads.com/oauth/authorize");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  return url.toString();
}

function nowPlusSeconds(seconds?: number): string | null {
  if (typeof seconds !== "number") return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function threadsJsonOrThrow(res: Response) {
  const json: any = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Threads API HTTP ${res.status}: ${JSON.stringify(json)}`);
  if (json?.error) throw new Error(`Threads API error: ${JSON.stringify(json.error)}`);
  return json;
}

export async function exchangeThreadsCodeForToken(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{
  accessToken: string;
  threadsUserId: string;
  tokenExpiresAt: string | null;
  expiresIn?: number;
}> {
  const res = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
  });

  const json: any = await threadsJsonOrThrow(res);
  const accessToken = json?.access_token;
  const userId = json?.user_id;
  const expiresIn = typeof json?.expires_in === "number" ? json.expires_in : undefined;

  if (!accessToken || !userId) {
    throw new Error(`Threads token exchange missing fields: ${JSON.stringify(json)}`);
  }

  return {
    accessToken: String(accessToken),
    threadsUserId: String(userId),
    tokenExpiresAt: nowPlusSeconds(expiresIn),
    expiresIn,
  };
}

export type ThreadsCreateResult = { creationId: string };

/**
 * Create a Threads post container.
 *
 * NOTE: Payload fields may vary depending on media type. This implementation supports TEXT.
 * If you later add IMAGE/VIDEO, extend this with `image_url` / `video_url` and appropriate `media_type`.
 */
export async function createThreadsTextPost(input: {
  accessToken: string;
  threadsUserId: string;
  text: string;
}): Promise<ThreadsCreateResult> {
  const url = new URL(`https://graph.threads.net/v1.0/${encodeURIComponent(input.threadsUserId)}/threads`);
  url.searchParams.set("access_token", input.accessToken);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Common Threads API pattern
      media_type: "TEXT",
      text: input.text,
    }),
  });

  const json: any = await threadsJsonOrThrow(res);
  const creationId = json?.id || json?.creation_id;
  if (!creationId) throw new Error(`Threads create missing creation id: ${JSON.stringify(json)}`);
  return { creationId: String(creationId) };
}

export async function publishThreadsPost(input: {
  accessToken: string;
  threadsUserId: string;
  creationId: string;
}): Promise<{ postId: string }> {
  const url = new URL(
    `https://graph.threads.net/v1.0/${encodeURIComponent(input.threadsUserId)}/threads_publish`
  );
  url.searchParams.set("access_token", input.accessToken);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: input.creationId,
    }),
  });

  const json: any = await threadsJsonOrThrow(res);
  const postId = json?.id;
  if (!postId) throw new Error(`Threads publish missing id: ${JSON.stringify(json)}`);
  return { postId: String(postId) };
}


