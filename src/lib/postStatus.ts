// Map legacy uppercase status values → new lowercase DB enum values
export function mapToDbStatus(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "draft",
    PROCESSING: "draft",
    READY_TO_PUBLISH: "draft",
    PENDING: "pending_approval",
    APPROVAL_REQUESTED: "pending_approval",
    APPROVAL_APPROVED: "approved",
    APPROVED: "approved",
    SCHEDULED: "scheduled",
    POSTED: "published",
    PUBLISHED: "published",
    REJECTED: "rejected",
  };
  return map[status.toUpperCase()] ?? status.toLowerCase();
}

// Map new DB enum values → legacy uppercase values expected by frontend
export function mapFromDbStatus(dbStatus: string, postType?: string): string {
  const map: Record<string, string> = {
    draft: postType === "video" ? "PROCESSING" : "DRAFT",
    pending_approval: "APPROVAL_REQUESTED",
    approved: "APPROVAL_APPROVED",
    scheduled: "SCHEDULED",
    published: "POSTED",
    rejected: "REJECTED",
  };
  return map[dbStatus] ?? dbStatus.toUpperCase();
}
