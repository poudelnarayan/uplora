"use client";

import { CheckCircle, Clock, Check } from "lucide-react";

type Status = "PROCESSING" | "READY" | "PENDING" | "APPROVED" | "PUBLISHED";

export function StatusChip({ status }: { status: Status }) {
  const baseClasses = "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all duration-200";
  const fontStyle = { fontFamily: 'Inter, Open Sans, sans-serif' };

  if (status === "PUBLISHED") {
    return (
      <span className={`${baseClasses} bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700`} style={fontStyle}>
        <CheckCircle className="w-4 h-4" />
        Published
      </span>
    );
  }
  
  if (status === "PENDING") {
    return (
      <span className={`${baseClasses} bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700`} style={fontStyle}>
        <Clock className="w-4 h-4" />
        Awaiting Approval
      </span>
    );
  }

  if (status === "APPROVED") {
    return (
      <span className={`${baseClasses} bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700`} style={fontStyle}>
        <Check className="w-4 h-4" />
        Approved
      </span>
    );
  }

  if (status === "READY") {
    return (
      <span className={`${baseClasses} bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700`} style={fontStyle}>
        <Check className="w-4 h-4" />
        Ready to post
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