"use client";

import ReelCaptionEditor from "./ReelCaptionEditor";

interface ReelPostDetailsProps {
  title: string;
  content: string;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  selectedPlatforms: string[];
  locked?: boolean;
}

export default function ReelPostDetails({
  title,
  content,
  onTitleChange,
  onContentChange,
  selectedPlatforms,
  locked,
}: ReelPostDetailsProps) {
  return (
    <div className="space-y-4">

      {/* Title */}
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-[0.18em] text-primary">Title</label>
        <input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Enter a compelling title…"
          disabled={locked}
          className="w-full bg-background border border-border/60 focus:border-primary/40 rounded-xl px-4 py-3 text-foreground font-semibold text-base placeholder:text-muted-foreground/40 focus:ring-0 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Caption */}
      <ReelCaptionEditor
        content={content}
        onChange={onContentChange}
        selectedPlatforms={selectedPlatforms}
        locked={locked}
      />
    </div>
  );
}
