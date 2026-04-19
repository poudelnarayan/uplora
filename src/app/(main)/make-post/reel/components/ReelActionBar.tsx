"use client";

import { Loader2 } from "lucide-react";

interface ReelActionBarProps {
  onPublish: () => void;
  onDraft: () => void;
  onRequestApproval?: () => void;
  onApprove?: () => void;
  isPublishing: boolean;
  isDrafting: boolean;
  isUploading: boolean;
  isRequestingApproval?: boolean;
  isApproving?: boolean;
  showRequestApproval?: boolean;
  showApprove?: boolean;
  selectedPlatforms: string[];
}

export default function ReelActionBar({
  onPublish,
  onDraft,
  onRequestApproval,
  onApprove,
  isPublishing,
  isDrafting,
  isUploading,
  isRequestingApproval,
  isApproving,
  showRequestApproval,
  showApprove,
  selectedPlatforms,
}: ReelActionBarProps) {
  const busy = isPublishing || isUploading || isDrafting;

  return (
    <div className="flex flex-col gap-3 pt-4">
      {showApprove && (
        <button
          onClick={onApprove}
          disabled={!!isApproving || busy}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-black text-lg py-5 rounded-[1.5rem] shadow-2xl shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {isApproving && <Loader2 className="h-5 w-5 animate-spin" />}
          Approve &amp; Publish
        </button>
      )}

      {showRequestApproval && (
        <button
          onClick={onRequestApproval}
          disabled={!!isRequestingApproval || busy}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-black text-lg py-5 rounded-[1.5rem] shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {isRequestingApproval && <Loader2 className="h-5 w-5 animate-spin" />}
          Request Approval
        </button>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={onPublish}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black text-lg py-5 rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {(isPublishing || isUploading) && <Loader2 className="h-5 w-5 animate-spin" />}
          {isUploading
            ? "Uploading…"
            : isPublishing
            ? "Saving…"
            : selectedPlatforms.length > 0
            ? `Publish to ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? "s" : ""}`
            : "Publish"}
        </button>
        <button
          onClick={onDraft}
          disabled={busy}
          className="px-8 py-5 rounded-[1.5rem] bg-muted text-foreground font-bold hover:bg-muted/80 transition-all disabled:opacity-60"
        >
          {isDrafting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Draft"}
        </button>
      </div>
    </div>
  );
}
