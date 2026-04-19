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
    <section className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label htmlFor="reel-title" className="text-sm font-medium">
            Title
          </label>
          <span className="text-xs text-muted-foreground">
            {title.length}/100
          </span>
        </div>
        <input
          id="reel-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="A compelling title…"
          maxLength={100}
          disabled={locked}
          className="w-full bg-background border border-border/60 focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10 rounded-lg px-3.5 py-2.5 text-[15px] outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Caption */}
      <ReelCaptionEditor
        content={content}
        onChange={onContentChange}
        selectedPlatforms={selectedPlatforms}
        locked={locked}
      />
    </section>
  );
}
