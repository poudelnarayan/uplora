"use client";

import { CheckCircle, Clock } from "lucide-react";

type Status = "PROCESSING" | "PENDING" | "PUBLISHED";

export function StatusChip({ status }: { status: Status }) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] sm:text-sm font-medium whitespace-nowrap leading-none antialiased";

  if (status === "PUBLISHED") {
    return (
      <span className={`${base} bg-green-50 text-green-700 ring-1 ring-green-200`}>
        <CheckCircle className="w-4 h-4" /> Published
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className={`${base} bg-amber-50 text-amber-700 ring-1 ring-amber-200`}>
        <Clock className="w-4 h-4" /> Awaiting Publish
      </span>
    );
  }
  return (
    <span className={`${base} bg-blue-50 text-blue-700 ring-1 ring-blue-200`}>
      <Clock className="w-4 h-4" /> Processing
    </span>
  );
}


