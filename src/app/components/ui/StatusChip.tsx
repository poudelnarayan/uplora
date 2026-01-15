"use client";

import { CheckCircle, Clock, Check, Calendar, Send, ShieldCheck } from "lucide-react";

type Status = "PROCESSING" | "READY_TO_PUBLISH" | "APPROVAL_REQUESTED" | "APPROVAL_APPROVED" | "SCHEDULED" | "POSTED" | "PUBLISHED" | "READY" | "PENDING" | "APPROVED";

export function StatusChip({ status }: { status: Status | string }) {
  const baseClasses = "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all duration-200";
  const fontStyle = { fontFamily: 'Inter, Open Sans, sans-serif' };

  const upperStatus = String(status || "PROCESSING").toUpperCase().replace(/\s+/g, "_");

  // Posted / Published
  if (upperStatus === "POSTED" || upperStatus === "PUBLISHED") {
    return (
      <span className={`${baseClasses} bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700`} style={fontStyle}>
        <CheckCircle className="w-4 h-4" />
        Posted
      </span>
    );
  }

  // Scheduled
  if (upperStatus === "SCHEDULED") {
    return (
      <span className={`${baseClasses} bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700`} style={fontStyle}>
        <Calendar className="w-4 h-4" />
        Scheduled
      </span>
    );
  }

  // Approval Approved
  if (upperStatus === "APPROVAL_APPROVED" || upperStatus === "APPROVED") {
    return (
      <span className={`${baseClasses} bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700`} style={fontStyle}>
        <ShieldCheck className="w-4 h-4" />
        Approved
      </span>
    );
  }

  // Approval Requested
  if (upperStatus === "APPROVAL_REQUESTED") {
    return (
      <span className={`${baseClasses} bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700`} style={fontStyle}>
        <Send className="w-4 h-4" />
        Approval Requested
      </span>
    );
  }

  // Ready to Publish
  if (upperStatus === "READY_TO_PUBLISH" || upperStatus === "READY" || upperStatus === "PENDING") {
    return (
      <span className={`${baseClasses} bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700`} style={fontStyle}>
        <Check className="w-4 h-4" />
        Ready to Publish
      </span>
    );
  }
  
  // Processing (default)
  return (
    <span className={`${baseClasses} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700`} style={fontStyle}>
      <Clock className="w-4 h-4" />
        Processing
    </span>
  );
}

/**
 * Helper to compute display status from video state
 */
export function getDisplayStatus(video: {
  status?: string | null;
  requestedByUserId?: string | null;
  approvedByUserId?: string | null;
}): string {
  const dbStatus = String(video.status || "PROCESSING").toUpperCase();
  
  if (dbStatus === "PUBLISHED") return "POSTED";
  if (dbStatus === "SCHEDULED") return "SCHEDULED";
  
  if (dbStatus === "PENDING") {
    if (video.approvedByUserId) return "APPROVAL_APPROVED";
    if (video.requestedByUserId) return "APPROVAL_REQUESTED";
    return "READY_TO_PUBLISH";
  }
  
  return "PROCESSING";
}
