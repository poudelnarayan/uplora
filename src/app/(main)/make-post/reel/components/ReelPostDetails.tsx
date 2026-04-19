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
    <div className="bg-white p-10 rounded-[2rem] shadow-[0px_30px_60px_rgba(0,88,190,0.04)] space-y-10">
      {/* Title */}
      <div>
        <label className="block text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
          Reel Title
        </label>
        <input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Enter a compelling title..."
          disabled={locked}
          className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/20 rounded-2xl px-8 py-5 text-foreground font-semibold focus:ring-0 transition-all outline-none text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Caption — smart editor */}
      <ReelCaptionEditor
        content={content}
        onChange={onContentChange}
        selectedPlatforms={selectedPlatforms}
        locked={locked}
      />
    </div>
  );
}
