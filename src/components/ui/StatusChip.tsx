"use client";

import { CheckCircle, Clock } from "lucide-react";

type Status = "PROCESSING" | "PENDING" | "PUBLISHED";

export function StatusChip({ status }: { status: Status }) {
  const base = "status-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap leading-none antialiased";

  if (status === "PUBLISHED") {
    return (
      <span className={`${base} status-published`}>
        <CheckCircle className="w-4 h-4" /> Published
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className={`${base} status-pending`}>
        <Clock className="w-4 h-4" /> Awaiting Publish
      </span>
    );
  }
  return (
    <span className={`${base} status-processing`}>
      <Clock className="w-4 h-4" /> Processing
    </span>
  );
}


