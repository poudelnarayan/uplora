/**
 * Video status enum values - must match database enum "VideoStatus"
 * 
 * Workflow:
 * 1. PROCESSING - Video just uploaded, being processed
 * 2. READY_TO_PUBLISH - Editor marked video as ready
 * 3. APPROVAL_REQUESTED - Editor requested approval from owner/admin
 * 4. APPROVAL_APPROVED - Owner/admin approved the video
 * 5. POSTED - Video published to YouTube
 * 6. SCHEDULED - Video scheduled for future publishing
 */
export const VideoStatus = {
  PROCESSING: "PROCESSING",
  READY_TO_PUBLISH: "READY_TO_PUBLISH",
  APPROVAL_REQUESTED: "APPROVAL_REQUESTED",
  APPROVAL_APPROVED: "APPROVAL_APPROVED",
  POSTED: "POSTED",
  SCHEDULED: "SCHEDULED",
} as const;

export type VideoStatusType = typeof VideoStatus[keyof typeof VideoStatus];

/**
 * Check if a status string is a valid VideoStatus
 */
export function isValidVideoStatus(status: string): status is VideoStatusType {
  return Object.values(VideoStatus).includes(status as VideoStatusType);
}

/**
 * Normalize old status values to new ones (for migration compatibility)
 */
export function normalizeStatus(status: string | null | undefined): VideoStatusType {
  const upper = String(status || "PROCESSING").toUpperCase();
  
  // Handle old values
  if (upper === "PENDING") return VideoStatus.READY_TO_PUBLISH;
  if (upper === "PUBLISHED") return VideoStatus.POSTED;
  if (upper === "APPROVED") return VideoStatus.APPROVAL_APPROVED;
  if (upper === "READY") return VideoStatus.READY_TO_PUBLISH;
  
  // Return as-is if valid, otherwise default to PROCESSING
  if (isValidVideoStatus(upper)) return upper;
  return VideoStatus.PROCESSING;
}

