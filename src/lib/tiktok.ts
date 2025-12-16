import fs from "node:fs/promises";
import path from "node:path";

/**
 * TikTok API helper module (pure functions, no Next.js route handlers).
 *
 * OAuth v2 endpoints are under:
 * - Auth screen: https://www.tiktok.com/v2/auth/authorize/
 * - Token:       https://open.tiktokapis.com/v2/oauth/token/
 * - User info:   https://open.tiktokapis.com/v2/user/info/
 *
 * Content Posting (upload video to inbox/draft):
 * - Init:        https://open.tiktokapis.com/v2/post/publish/inbox/video/init/
 * - Upload:      PUT chunks to `upload_url` returned by init
 */

export type TikTokTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  open_id?: string;
  scope?: string;
  token_type?: string;
};

export type TikTokUserInfo = {
  openId?: string;
  unionId?: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

function nowPlusSeconds(seconds?: number): string | null {
  if (typeof seconds !== "number") return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function buildTikTokAuthorizeUrl(params: {
  clientKey: string;
  redirectUri: string;
  state: string;
  scope: string; // comma-separated per requirement: "user.info.basic,video.upload"
}): string {
  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", params.clientKey);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  return url.toString();
}

async function tiktokJsonOrThrow(res: Response) {
  const json: any = await res.json().catch(() => null);
  // TikTok often returns { error: { code, message, log_id } } on failure
  if (!res.ok) {
    throw new Error(`TikTok API HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (json?.error) {
    throw new Error(`TikTok API error: ${JSON.stringify(json.error)}`);
  }
  return json;
}

/**
 * Exchange authorization code for access + refresh token.
 */
export async function exchangeTikTokCodeForTokens(input: {
  code: string;
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  openId?: string;
  scope?: string;
}> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: input.clientKey,
      client_secret: input.clientSecret,
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
  });

  const json: any = await tiktokJsonOrThrow(res);
  const data: TikTokTokenResponse = json?.data;
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error(`TikTok token exchange missing fields: ${JSON.stringify(json)}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: nowPlusSeconds(data.expires_in),
    refreshTokenExpiresAt: nowPlusSeconds(data.refresh_expires_in),
    openId: data.open_id,
    scope: data.scope,
  };
}

/**
 * Refresh TikTok access token using refresh_token.
 */
export async function refreshTikTokAccessToken(input: {
  refreshToken: string;
  clientKey: string;
  clientSecret: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  openId?: string;
  scope?: string;
}> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: input.clientKey,
      client_secret: input.clientSecret,
      grant_type: "refresh_token",
      refresh_token: input.refreshToken,
    }),
  });

  const json: any = await tiktokJsonOrThrow(res);
  const data: TikTokTokenResponse = json?.data;
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error(`TikTok refresh missing fields: ${JSON.stringify(json)}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: nowPlusSeconds(data.expires_in),
    refreshTokenExpiresAt: nowPlusSeconds(data.refresh_expires_in),
    openId: data.open_id,
    scope: data.scope,
  };
}

/**
 * Fetch basic TikTok user info (requires user.info.basic scope).
 */
export async function fetchTikTokUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  // Fields list depends on TikTok API. We request a minimal set.
  const url = new URL("https://open.tiktokapis.com/v2/user/info/");
  url.searchParams.set("fields", ["open_id", "union_id", "display_name", "username", "avatar_url"].join(","));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json: any = await tiktokJsonOrThrow(res);
  const user = json?.data?.user || {};

  return {
    openId: user.open_id ? String(user.open_id) : undefined,
    unionId: user.union_id ? String(user.union_id) : undefined,
    username: user.username ?? null,
    displayName: user.display_name ?? null,
    avatarUrl: user.avatar_url ?? null,
  };
}

export type TikTokUploadInitResponse = {
  uploadUrl: string;
  publishId: string;
};

/**
 * Initialize an inbox (draft) video upload.
 *
 * TikTok "inbox" mode is commonly used for draft/sandbox flows; the user finishes in the TikTok app.
 */
export async function initTikTokInboxVideoUpload(input: {
  accessToken: string;
  caption: string;
  videoSize: number;
  chunkSize: number;
  totalChunkCount: number;
}): Promise<TikTokUploadInitResponse> {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: input.caption,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: input.videoSize,
        chunk_size: input.chunkSize,
        total_chunk_count: input.totalChunkCount,
      },
    }),
  });

  const json: any = await tiktokJsonOrThrow(res);
  const data = json?.data;
  const uploadUrl = data?.upload_url;
  const publishId = data?.publish_id;
  if (!uploadUrl || !publishId) {
    throw new Error(`TikTok upload init missing fields: ${JSON.stringify(json)}`);
  }
  return { uploadUrl: String(uploadUrl), publishId: String(publishId) };
}

/**
 * Upload a local video file to TikTok using the `upload_url` returned by init.
 *
 * This implements a sequential chunked PUT upload (push-by-file).
 */
export async function uploadTikTokVideoFileToUploadUrl(input: {
  uploadUrl: string;
  filePath: string;
  chunkSize: number;
  contentType?: string;
}): Promise<void> {
  const stat = await fs.stat(input.filePath);
  const fileSize = stat.size;
  const chunkSize = input.chunkSize;
  const totalChunks = Math.ceil(fileSize / chunkSize);

  // Upload each chunk with Content-Range
  const fh = await fs.open(input.filePath, "r");
  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const endExclusive = Math.min(start + chunkSize, fileSize);
      const len = endExclusive - start;

      const buf = Buffer.allocUnsafe(len);
      await fh.read(buf, 0, len, start);

      const res = await fetch(input.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": input.contentType || "application/octet-stream",
          "Content-Length": String(len),
          "Content-Range": `bytes ${start}-${endExclusive - 1}/${fileSize}`,
        },
        body: buf,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`TikTok upload chunk failed (chunk ${i + 1}/${totalChunks}) HTTP ${res.status}: ${text}`);
      }
    }
  } finally {
    await fh.close();
  }
}

/**
 * High-level helper: initialize + upload a video as draft (inbox) for TikTok.
 *
 * Returns a publishId you can track (and the user will see an inbox notification in TikTok).
 */
export async function uploadTikTokVideo(
  accessToken: string,
  filePathInput: string,
  caption: string
): Promise<{ publishId: string }> {
  const filePath = path.resolve(filePathInput);
  const stat = await fs.stat(filePath);

  // Reasonable default chunk size (10 MiB). TikTok may enforce limits; adjust as needed.
  const chunkSize = 10 * 1024 * 1024;
  const totalChunkCount = Math.ceil(stat.size / chunkSize);

  const { uploadUrl, publishId } = await initTikTokInboxVideoUpload({
    accessToken,
    caption,
    videoSize: stat.size,
    chunkSize,
    totalChunkCount,
  });

  await uploadTikTokVideoFileToUploadUrl({
    uploadUrl,
    filePath,
    chunkSize,
    contentType: "video/mp4",
  });

  return { publishId };
}


