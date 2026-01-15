import { google } from "googleapis";
import fs from "fs";
import { z } from "zod";
import { Readable } from "stream";
import { getUserSocialConnections, updateUserSocialConnections } from "@/server/services/socialConnections";

const YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_RETRIES = 3;

export type UploadSource = {
  sizeBytes: number;
  mimeType: string;
  createReadStream: (startByte?: number) => Promise<Readable> | Readable;
};

export type YouTubeUploadMetadata = {
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
  privacyStatus: "public" | "unlisted" | "private";
  publishAt?: string | null;
  madeForKids?: boolean;
  selfDeclaredMadeForKids?: boolean;
};

export type YouTubeUploadProgress = {
  bytesSent: number;
  totalBytes: number;
  percent: number;
};

export type YouTubeUploadResult = {
  youtubeVideoId: string;
  uploadStatus: "UPLOADING" | "PROCESSING" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  publishAt?: string | null;
  visibility: "public" | "unlisted" | "private";
  rawResponse?: any;
};

export async function createFileUploadSource(filePath: string, mimeType = "video/mp4"): Promise<UploadSource> {
  const stats = await fs.promises.stat(filePath);
  if (!stats.isFile()) {
    throw new Error("Provided file path is not a file.");
  }

  return {
    sizeBytes: stats.size,
    mimeType,
    createReadStream: (startByte = 0) => fs.createReadStream(filePath, { start: startByte || 0 }),
  };
}

const metadataSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional().default(""),
  tags: z.array(z.string().min(1).max(30)).max(500).optional(),
  categoryId: z.string().max(32).optional(),
  defaultLanguage: z.string().max(16).optional(),
  defaultAudioLanguage: z.string().max(16).optional(),
  privacyStatus: z.enum(["public", "unlisted", "private"]).default("private"),
  publishAt: z.string().datetime().optional().nullable(),
  madeForKids: z.boolean().optional(),
  selfDeclaredMadeForKids: z.boolean().optional(),
});

export function validateAndNormalizeMetadata(input: unknown): YouTubeUploadMetadata {
  const parsed = metadataSchema.parse(input);
  const publishAt = parsed.publishAt ? new Date(parsed.publishAt) : null;
  if (publishAt && Number.isNaN(publishAt.getTime())) {
    throw new Error("Invalid publishAt timestamp.");
  }
  if (publishAt && publishAt.getTime() <= Date.now()) {
    throw new Error("publishAt must be a future time.");
  }

  // Schedule requires private upload, then publish at time.
  const visibility = publishAt ? "private" : parsed.privacyStatus;
  const selfDeclaredMadeForKids = parsed.selfDeclaredMadeForKids ?? parsed.madeForKids ?? false;

  return {
    title: parsed.title,
    description: parsed.description || "",
    tags: parsed.tags,
    categoryId: parsed.categoryId,
    defaultLanguage: parsed.defaultLanguage,
    defaultAudioLanguage: parsed.defaultAudioLanguage,
    privacyStatus: visibility,
    publishAt: publishAt ? publishAt.toISOString() : null,
    madeForKids: parsed.madeForKids ?? false,
    selfDeclaredMadeForKids,
  };
}

export function mapMetadataToRequest(metadata: YouTubeUploadMetadata) {
  const snippet: Record<string, any> = {
    title: metadata.title,
    description: metadata.description || "",
  };
  if (metadata.tags?.length) snippet.tags = metadata.tags;
  if (metadata.categoryId) snippet.categoryId = metadata.categoryId;
  if (metadata.defaultLanguage) snippet.defaultLanguage = metadata.defaultLanguage;
  if (metadata.defaultAudioLanguage) snippet.defaultAudioLanguage = metadata.defaultAudioLanguage;

  const status: Record<string, any> = {
    privacyStatus: metadata.privacyStatus,
    selfDeclaredMadeForKids: metadata.selfDeclaredMadeForKids,
  };
  if (metadata.publishAt) status.publishAt = metadata.publishAt;

  return { snippet, status };
}

async function refreshAccessToken(refreshToken: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Refresh failed: ${err.error || resp.statusText}`);
  }

  return resp.json();
}

async function getYouTubeAccess(userId: string) {
  const social = await getUserSocialConnections(userId);
  const yt = social.youtube;
  if (!yt?.accessToken || !yt?.refreshToken) {
    throw new Error("YouTube not connected.");
  }

  const expiresAt = yt.tokenExpiresAt ? Date.parse(yt.tokenExpiresAt) : 0;
  const now = Date.now();
  if (expiresAt && expiresAt - now > 60_000) {
    return { accessToken: yt.accessToken, refreshToken: yt.refreshToken };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "";
  const redirectUri = process.env.YT_REDIRECT_URI || `${origin}/api/youtube/connect`;
  const tokenData = await refreshAccessToken(yt.refreshToken, redirectUri);

  await updateUserSocialConnections(userId, current => ({
    ...current,
    youtube: {
      ...(current.youtube || {}),
      accessToken: tokenData.access_token || yt.accessToken,
      refreshToken: tokenData.refresh_token || yt.refreshToken,
      tokenExpiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : yt.tokenExpiresAt,
    },
  }));

  return {
    accessToken: tokenData.access_token || yt.accessToken,
    refreshToken: tokenData.refresh_token || yt.refreshToken,
  };
}

async function initiateResumableUpload(
  accessToken: string,
  metadata: YouTubeUploadMetadata,
  source: UploadSource
) {
  const { snippet, status } = mapMetadataToRequest(metadata);
  const url = new URL(YOUTUBE_UPLOAD_URL);
  url.searchParams.set("uploadType", "resumable");
  url.searchParams.set("part", "snippet,status");

  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Upload-Content-Type": source.mimeType,
      "X-Upload-Content-Length": String(source.sizeBytes),
    },
    body: JSON.stringify({ snippet, status }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to initiate resumable upload.");
  }

  const location = resp.headers.get("location");
  if (!location) {
    throw new Error("Resumable upload URL missing.");
  }

  return location;
}

async function getResumeOffset(uploadUrl: string, accessToken: string, totalBytes: number) {
  const resp = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": "0",
      "Content-Range": `bytes */${totalBytes}`,
    },
  });

  if (resp.status !== 308) {
    return 0;
  }

  const range = resp.headers.get("range");
  if (!range) return 0;
  const match = range.match(/bytes=0-(\d+)/);
  if (!match) return 0;
  return Number(match[1]) + 1;
}

function parseUploadStatus(raw: any): YouTubeUploadResult["uploadStatus"] {
  const privacy = raw?.status?.privacyStatus;
  const publishAt = raw?.status?.publishAt;
  if (publishAt) return "SCHEDULED";
  if (privacy === "public" || privacy === "unlisted") return "PUBLISHED";
  return "PROCESSING";
}

async function uploadChunk(
  uploadUrl: string,
  accessToken: string,
  chunk: Buffer,
  start: number,
  totalBytes: number
) {
  const end = start + chunk.length - 1;
  const resp = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": String(chunk.length),
      "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
    },
    body: chunk,
  });

  return resp;
}

async function uploadResumable(
  uploadUrl: string,
  accessToken: string,
  source: UploadSource,
  onProgress?: (progress: YouTubeUploadProgress) => void
) {
  let offset = 0;
  let bytesSent = 0;
  const totalBytes = source.sizeBytes;

  const reportProgress = () => {
    if (!onProgress) return;
    const percent = totalBytes ? Math.min(100, Math.round((bytesSent / totalBytes) * 100)) : 0;
    onProgress({ bytesSent, totalBytes, percent });
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      if (offset > 0) {
        bytesSent = offset;
        reportProgress();
      }
      const stream = await source.createReadStream(offset);
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
        while (buffer.length >= DEFAULT_CHUNK_SIZE) {
          const part = buffer.subarray(0, DEFAULT_CHUNK_SIZE);
          buffer = buffer.subarray(DEFAULT_CHUNK_SIZE);
          const resp = await uploadChunk(uploadUrl, accessToken, part, offset, totalBytes);
          if (resp.status === 308) {
            offset += part.length;
            bytesSent = offset;
            reportProgress();
            continue;
          }
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err?.error?.message || `Upload failed: ${resp.status}`);
          }
          const result = await resp.json().catch(() => ({}));
          return result;
        }
      }

      if (buffer.length) {
        const resp = await uploadChunk(uploadUrl, accessToken, buffer, offset, totalBytes);
        if (resp.status === 308) {
          offset += buffer.length;
          bytesSent = offset;
          reportProgress();
        } else if (resp.ok) {
          const result = await resp.json().catch(() => ({}));
          return result;
        } else {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Upload failed: ${resp.status}`);
        }
      }
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      offset = await getResumeOffset(uploadUrl, accessToken, totalBytes);
    }
  }

  throw new Error("Upload failed after retries.");
}

export async function uploadYouTubeVideo(
  publisherUserId: string,
  source: UploadSource,
  metadata: YouTubeUploadMetadata,
  onProgress?: (progress: YouTubeUploadProgress) => void
): Promise<YouTubeUploadResult> {
  const { accessToken } = await getYouTubeAccess(publisherUserId);
  const uploadUrl = await initiateResumableUpload(accessToken, metadata, source);

  const rawResponse = await uploadResumable(uploadUrl, accessToken, source, onProgress);
  const youtubeVideoId = rawResponse?.id;
  if (!youtubeVideoId) {
    throw new Error("YouTube upload succeeded but no videoId returned.");
  }

  const uploadStatus = parseUploadStatus(rawResponse);
  return {
    youtubeVideoId,
    uploadStatus,
    publishAt: rawResponse?.status?.publishAt || metadata.publishAt || null,
    visibility: rawResponse?.status?.privacyStatus || metadata.privacyStatus,
    rawResponse,
  };
}

/**
 * Thumbnail upload status types
 */
export type ThumbnailUploadStatus = "PENDING" | "SUCCESS" | "FAILED";

/**
 * Thumbnail upload result
 */
export type ThumbnailUploadResult = {
  status: ThumbnailUploadStatus;
  error?: string;
  errorCode?: string;
};

/**
 * Valid thumbnail MIME types
 */
const VALID_THUMBNAIL_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

/**
 * Maximum thumbnail size: 2MB (YouTube limit)
 */
const MAX_THUMBNAIL_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Validates thumbnail buffer before upload
 */
export function validateThumbnail(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  // Check MIME type
  if (!VALID_THUMBNAIL_TYPES.has(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid image format. Accepted formats: JPG, PNG, WEBP. Got: ${mimeType}`,
    };
  }

  // Check size
  if (buffer.length > MAX_THUMBNAIL_SIZE_BYTES) {
    return {
      valid: false,
      error: `Thumbnail size exceeds 2MB limit. Size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Check minimum size (must be at least a few bytes)
  if (buffer.length < 100) {
    return {
      valid: false,
      error: "Thumbnail file appears to be empty or corrupted",
    };
  }

  return { valid: true };
}

/**
 * Uploads a custom thumbnail to YouTube
 * 
 * @param publisherUserId - User ID of the YouTube account owner
 * @param youtubeVideoId - YouTube video ID to attach thumbnail to
 * @param buffer - Image buffer (JPG, PNG, or WEBP)
 * @param mimeType - MIME type of the image
 * @returns Upload result with status and error info
 */
export async function uploadYouTubeThumbnail(
  publisherUserId: string,
  youtubeVideoId: string,
  buffer: Buffer,
  mimeType: string
): Promise<ThumbnailUploadResult> {
  try {
    // Validate thumbnail before upload
    const validation = validateThumbnail(buffer, mimeType);
    if (!validation.valid) {
      return {
        status: "FAILED",
        error: validation.error,
        errorCode: "VALIDATION_ERROR",
      };
    }

    // Get and refresh YouTube access token
    let accessToken: string;
    let refreshToken: string;
    try {
      const tokens = await getYouTubeAccess(publisherUserId);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    } catch (err: any) {
      return {
        status: "FAILED",
        error: err?.message || "Failed to get YouTube access token",
        errorCode: "AUTH_ERROR",
      };
    }

    // Prepare OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.uplora.io"}/api/youtube/connect`
    );
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Create YouTube API client
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Upload thumbnail using YouTube Data API v3
    try {
      await youtube.thumbnails.set({
        videoId: youtubeVideoId,
        media: {
          body: Readable.from(buffer),
          mimeType: mimeType,
        },
      });

      return {
        status: "SUCCESS",
      };
    } catch (uploadErr: any) {
      // Handle specific YouTube API errors
      const errorMessage = uploadErr?.message || "Unknown error";
      const errorCode = uploadErr?.code || uploadErr?.response?.status || "UPLOAD_ERROR";

      // Check for common error scenarios
      if (errorMessage.includes("unverified") || errorMessage.includes("verification")) {
        return {
          status: "FAILED",
          error: "YouTube channel is not verified. Custom thumbnails require channel verification.",
          errorCode: "UNVERIFIED_CHANNEL",
        };
      }

      if (errorMessage.includes("quota") || errorCode === 403) {
        return {
          status: "FAILED",
          error: "YouTube API quota exceeded or access denied",
          errorCode: "QUOTA_EXCEEDED",
        };
      }

      if (errorCode === 401) {
        // Token expired, try refreshing once
        try {
          const tokens = await getYouTubeAccess(publisherUserId);
          oauth2Client.setCredentials({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          });

          // Retry upload with fresh token
          await youtube.thumbnails.set({
            videoId: youtubeVideoId,
            media: {
              body: Readable.from(buffer),
              mimeType: mimeType,
            },
          });

          return {
            status: "SUCCESS",
          };
        } catch (retryErr: any) {
          return {
            status: "FAILED",
            error: retryErr?.message || "Failed to upload thumbnail after token refresh",
            errorCode: "AUTH_RETRY_FAILED",
          };
        }
      }

      return {
        status: "FAILED",
        error: errorMessage,
        errorCode: String(errorCode),
      };
    }
  } catch (err: any) {
    // Catch any unexpected errors
    return {
      status: "FAILED",
      error: err?.message || "Unexpected error during thumbnail upload",
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

