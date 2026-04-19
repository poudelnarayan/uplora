"use client";

interface CharCount {
  ig: number;
  tk: number;
}

interface ReelPostDetailsProps {
  title: string;
  content: string;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  locked?: boolean;
}

const IG_LIMIT = 2200;
const TK_LIMIT = 4000;

export default function ReelPostDetails({
  title,
  content,
  onTitleChange,
  onContentChange,
  locked,
}: ReelPostDetailsProps) {
  const counts: CharCount = { ig: content.length, tk: content.length };

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
          className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/10 rounded-2xl px-8 py-5 text-foreground font-semibold focus:ring-0 transition-all outline-none text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Caption */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-xs font-black text-primary uppercase tracking-[0.2em]">
            Caption &amp; Story
          </label>
          <div className="flex gap-2">
            <span className={`bg-primary/5 px-3 py-1.5 rounded-lg text-[0.65rem] font-black uppercase transition-colors ${counts.ig > IG_LIMIT ? "text-destructive" : "text-primary"}`}>
              IG: {counts.ig}/{IG_LIMIT}
            </span>
            <span className={`bg-secondary/10 px-3 py-1.5 rounded-lg text-[0.65rem] font-black uppercase transition-colors ${counts.tk > TK_LIMIT ? "text-destructive" : "text-muted-foreground"}`}>
              TK: {counts.tk}/{TK_LIMIT}
            </span>
          </div>
        </div>
        <textarea
          value={content}
          onChange={e => onContentChange(e.target.value)}
          placeholder="What's this reel about? Use #hashtags to increase reach..."
          rows={5}
          disabled={locked}
          className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/10 rounded-2xl px-8 py-6 text-foreground font-medium focus:ring-0 transition-all outline-none resize-none leading-relaxed text-base disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
