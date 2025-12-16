"use client";

import { CheckCircle, Clock, AlertCircle, Loader } from "lucide-react";

type Status = "PROCESSING" | "PENDING" | "PUBLISHED";

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
  
  return (
    <span className={`${baseClasses} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700`} style={fontStyle}>
      <Loader className="w-4 h-4 animate-spin" />
      Processing
    </span>
  );
}