"use client";

import { CheckCircle, Clock, Check, Calendar } from "lucide-react";

type Status = "PROCESSING" | "READY" | "PENDING" | "APPROVED" | "SCHEDULED" | "PUBLISHED";

export function StatusChip({ status }: { status: Status | string }) {
  const baseClasses = "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all duration-200";
  const fontStyle = { fontFamily: 'Inter, Open Sans, sans-serif' };

  const upperStatus = String(status || "PROCESSING").toUpperCase();

  if (upperStatus === "PUBLISHED") {
    return (
      <span className={`${baseClasses} bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700`} style={fontStyle}>
        <CheckCircle className="w-4 h-4" />
        Published
      </span>
    );
  }

  if (upperStatus === "SCHEDULED") {
    return (
      <span className={`${baseClasses} bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700`} style={fontStyle}>
        <Calendar className="w-4 h-4" />
        Scheduled
      </span>
    );
  }

  // Collapse internal workflow states to a single user-facing status: "Ready to publish"
  if (upperStatus === "READY" || upperStatus === "PENDING" || upperStatus === "APPROVED") {
    return (
      <span className={`${baseClasses} bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700`} style={fontStyle}>
        <Check className="w-4 h-4" />
        Ready to publish
      </span>
    );
  }
  
  return (
    <span className={`${baseClasses} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700`} style={fontStyle}>
      <Clock className="w-4 h-4" />
      Processing
    </span>
  );
}