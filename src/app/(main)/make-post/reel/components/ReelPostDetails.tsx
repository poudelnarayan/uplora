"use client";

import { Type, PenLine } from "lucide-react";
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
    <div className="space-y-5">

      {/* Title field */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Type className="h-3 w-3 text-primary" />
          </div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground">Title</label>
        </div>
        <input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Enter a compelling title…"
          disabled={locked}
          className="w-full bg-background/60 border border-border/50 focus:border-primary/50 focus:bg-background rounded-xl px-4 py-3 text-foreground font-semibold text-base placeholder:text-muted-foreground/35 focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* Caption */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <PenLine className="h-3 w-3 text-primary" />
          </div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground">Caption & Details</label>
        </div>
        <ReelCaptionEditor
          content={content}
          onChange={onContentChange}
          selectedPlatforms={selectedPlatforms}
          locked={locked}
        />
      </div>
    </div>
  );
}
