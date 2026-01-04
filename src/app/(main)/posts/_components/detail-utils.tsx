"use client";

import { Button } from "@/app/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    case "PENDING":
      return "bg-orange/10 text-orange border-orange/20";
    case "SCHEDULED":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "PUBLISHED":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    case "PROCESSING":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  }
}

function flatten(obj: unknown, prefix = ""): Array<{ key: string; value: string }> {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== "object") return [{ key: prefix || "value", value: String(obj) }];
  if (Array.isArray(obj)) {
    return obj.flatMap((v, i) => flatten(v, `${prefix}[${i}]`));
  }
  const rec = obj as Record<string, unknown>;
  return Object.keys(rec).flatMap((k) => flatten(rec[k], prefix ? `${prefix}.${k}` : k));
}

export function MetadataTable({ metadata }: { metadata: unknown }) {
  const rows = useMemo(() => flatten(metadata), [metadata]);
  if (!metadata || rows.length === 0) {
    return <div className="text-xs text-muted-foreground">No metadata</div>;
  }
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="divide-y">
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-3 bg-card">
            <div className="text-xs font-medium text-foreground break-words">{r.key}</div>
            <div className="text-xs text-muted-foreground break-words sm:col-span-2">{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CopyField({ label, value }: { label: string; value: string | null | undefined }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(t);
  }, [copied]);

  const canCopy = typeof value === "string" && value.length > 0;
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground break-words">{canCopy ? value : "—"}</div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
        disabled={!canCopy}
        onClick={async () => {
          if (!canCopy) return;
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          } catch {
            // no-op
          }
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}


