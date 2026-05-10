/**
 * Shared helpers for video post operations.
 *
 * Videos are stored as `posts` rows with `post_type = 'video'`.
 * File data lives in `post_media`; extra fields live in `posts.metadata`.
 *
 * Metadata field mapping (old video_posts column → metadata key):
 *   requestedByUserId   → requested_by_user_id
 *   approvedByUserId    → approved_by_user_id
 *   youtubeVideoId      → youtube_video_id
 *   youtubeUploadStatus → youtube_upload_status
 *   youtubeVisibility   → youtube_visibility
 *   youtubePublishAt    → youtube_publish_at
 *   youtubeThumbnailUploadStatus → youtube_thumbnail_upload_status
 *   youtubeThumbnailUploadError  → youtube_thumbnail_upload_error
 *   visibility          → visibility
 *   madeForKids         → made_for_kids
 *   video_status        → PROCESSING | READY_TO_PUBLISH (sub-state inside draft)
 *
 * Status mapping (old VideoStatus → post_status_enum):
 *   PROCESSING          → draft  (+ metadata.video_status = PROCESSING)
 *   READY_TO_PUBLISH    → draft  (+ metadata.video_status = READY_TO_PUBLISH)
 *   APPROVAL_REQUESTED  → pending_approval
 *   APPROVAL_APPROVED   → approved
 *   POSTED              → published
 *   SCHEDULED           → scheduled
 */

import { supabaseAdmin } from "./supabase";
import { VideoStatus, type VideoStatusType } from "@/types/videoStatus";

const VIDEO_STATUS_TO_DB: Record<string, string> = {
  [VideoStatus.PROCESSING]: "draft",
  [VideoStatus.READY_TO_PUBLISH]: "draft",
  [VideoStatus.APPROVAL_REQUESTED]: "pending_approval",
  [VideoStatus.APPROVAL_APPROVED]: "approved",
  [VideoStatus.POSTED]: "published",
  [VideoStatus.SCHEDULED]: "scheduled",
};

const DB_STATUS_TO_VIDEO: Record<string, VideoStatusType> = {
  draft: VideoStatus.PROCESSING,
  pending_approval: VideoStatus.APPROVAL_REQUESTED,
  approved: VideoStatus.APPROVAL_APPROVED,
  published: VideoStatus.POSTED,
  scheduled: VideoStatus.SCHEDULED,
  rejected: VideoStatus.PROCESSING,
};

export function videoStatusToDb(status: string): string {
  return VIDEO_STATUS_TO_DB[status.toUpperCase()] ?? "draft";
}

export function dbStatusToVideo(dbStatus: string, metadata?: any): VideoStatusType {
  if (dbStatus === "draft") {
    const sub = metadata?.video_status;
    if (sub === VideoStatus.READY_TO_PUBLISH) return VideoStatus.READY_TO_PUBLISH;
    return VideoStatus.PROCESSING;
  }
  return DB_STATUS_TO_VIDEO[dbStatus] ?? VideoStatus.PROCESSING;
}

export interface VideoRow {
  id: string;
  // file info (from post_media)
  key: string | null;
  filename: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  thumbnailKey: string | null;
  // post fields
  teamId: string | null;
  userId: string;       // author_id
  status: VideoStatusType;
  dbStatus: string;
  content: string | null;
  description: string | null;
  visibility: string | null;
  madeForKids: boolean;
  tags: string[];
  categoryId: string | null;
  updatedAt: string;
  createdAt: string;
  requestedByUserId: string | null;
  approvedByUserId: string | null;
  // YouTube
  youtubeVideoId: string | null;
  youtubeUploadStatus: string | null;
  youtubeVisibility: string | null;
  youtubePublishAt: string | null;
  youtubeThumbnailUploadStatus: string | null;
  youtubeThumbnailUploadError: string | null;
  // raw data
  metadata: any;
  _post: any;
}

export async function getVideoById(id: string): Promise<VideoRow | null> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      *,
      post_media (
        id,
        media_type,
        s3_key,
        filename,
        content_type,
        size_bytes,
        duration_ms,
        position
      )
    `)
    .eq("id", id)
    .eq("post_type", "video")
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  return postToVideoRow(data);
}

export function postToVideoRow(post: any): VideoRow {
  const media = (post.post_media || []);
  const videoMedia = media
    .filter((m: any) => m.media_type !== "thumbnail")
    .sort((a: any, b: any) => a.position - b.position)[0];
  const thumbMedia = media.find((m: any) => m.media_type === "thumbnail");
  const meta = post.metadata || {};

  const dbStatus = post.status ?? "draft";
  const videoStatus = dbStatusToVideo(dbStatus, meta);

  return {
    id: post.id,
    key: videoMedia?.s3_key ?? meta.key ?? null,
    filename: videoMedia?.filename ?? meta.filename ?? null,
    contentType: videoMedia?.content_type ?? meta.content_type ?? null,
    sizeBytes: videoMedia?.size_bytes ?? meta.size_bytes ?? null,
    thumbnailKey: thumbMedia?.s3_key ?? meta.thumbnail_key ?? null,
    teamId: post.team_id ?? null,
    userId: post.author_id,
    status: videoStatus,
    dbStatus,
    content: post.content ?? null,
    description: post.content ?? null,
    visibility: meta.visibility ?? null,
    madeForKids: meta.made_for_kids ?? false,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    categoryId: meta.category_id ?? null,
    updatedAt: post.updated_at,
    createdAt: post.created_at,
    requestedByUserId: meta.requested_by_user_id ?? null,
    approvedByUserId: meta.approved_by_user_id ?? null,
    youtubeVideoId: meta.youtube_video_id ?? null,
    youtubeUploadStatus: meta.youtube_upload_status ?? null,
    youtubeVisibility: meta.youtube_visibility ?? null,
    youtubePublishAt: meta.youtube_publish_at ?? null,
    youtubeThumbnailUploadStatus: meta.youtube_thumbnail_upload_status ?? null,
    youtubeThumbnailUploadError: meta.youtube_thumbnail_upload_error ?? null,
    metadata: meta,
    _post: post,
  };
}

export async function updateVideoStatus(
  id: string,
  newStatus: VideoStatusType,
  extraMeta?: Record<string, any>
): Promise<VideoRow | null> {
  const dbStatus = videoStatusToDb(newStatus);

  const { data: current } = await supabaseAdmin
    .from("posts")
    .select("metadata")
    .eq("id", id)
    .single();

  const currentMeta = current?.metadata || {};
  const metaUpdate: any = {
    ...currentMeta,
    ...(extraMeta || {}),
  };

  // Track video-specific sub-state inside draft
  if (dbStatus === "draft") {
    metaUpdate.video_status = newStatus;
  } else {
    delete metaUpdate.video_status;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("posts")
    .update({ status: dbStatus, metadata: metaUpdate, updated_at: now })
    .eq("id", id)
    .select(`
      *,
      post_media (id, media_type, s3_key, filename, content_type, size_bytes, duration_ms, position)
    `)
    .single();

  if (error) throw error;
  return postToVideoRow(data);
}

export async function updateVideoMetadata(
  id: string,
  metaFields: Record<string, any>
): Promise<void> {
  const { data: current } = await supabaseAdmin
    .from("posts")
    .select("metadata")
    .eq("id", id)
    .single();

  const merged = { ...(current?.metadata || {}), ...metaFields };
  await supabaseAdmin
    .from("posts")
    .update({ metadata: merged, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// Upsert user with snake_case columns
export async function syncUser(userId: string, clerkUser: any) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert({
      id: userId,
      clerk_id: userId,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
      name: clerkUser.fullName || clerkUser.firstName || "",
      image: clerkUser.imageUrl || "",
      updated_at: new Date().toISOString(),
    }, { onConflict: "clerk_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get team + determine caller's role
export async function getTeamAndRole(
  teamId: string,
  userId: string
): Promise<{ team: any; role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER" | null }> {
  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!team) return { team: null, role: null };

  if (team.owner_id === userId) return { team, role: "OWNER" };

  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("role, status")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || membership.status !== "ACTIVE") {
    return { team, role: null };
  }

  const role = membership.role as "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER";
  return { team, role };
}
