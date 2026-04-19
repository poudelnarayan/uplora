"use client";

import { useMemo } from "react";
import { Hash, AtSign, Link2 } from "lucide-react";

interface Platform {
  id: string;
  charLimit: number;
  hashtagLimit: number | null;
  linksClickable: boolean;
  visibleChars: number | null;
}

const PLATFORM_CONFIG: Record<string, Platform> = {
  Instagram: { id: "Instagram", charLimit: 2200, hashtagLimit: 5, linksClickable: false, visibleChars: 55 },
  Facebook:  { id: "Facebook",  charLimit: 63206, hashtagLimit: null, linksClickable: false, visibleChars: 480 },
  TikTok:    { id: "TikTok",    charLimit: 4000, hashtagLimit: null, linksClickable: true, visibleChars: null },
  YouTube:   { id: "YouTube",   charLimit: 5000, hashtagLimit: 15, linksClickable: true, visibleChars: null },
};

function countHashtags(text: string) {
  return (text.match(/#\w+/g) || []).length;
}
function countMentions(text: string) {
  return (text.match(/@\w+/g) || []).length;
}
function countLinks(text: string) {
  return (text.match(/https?:\/\/[^\s]+/g) || []).length;
}

interface ReelCaptionEditorProps {
  content: string;
  onChange: (v: string) => void;
  selectedPlatforms: string[];
  locked?: boolean;
}

export default function ReelCaptionEditor({
  content,
  onChange,
  selectedPlatforms,
  locked,
}: ReelCaptionEditorProps) {
  const hashtagCount = useMemo(() => countHashtags(content), [content]);
  const mentionCount = useMemo(() => countMentions(content), [content]);
  const linkCount = useMemo(() => countLinks(content), [content]);

  const activePlatforms = selectedPlatforms.filter((p) => PLATFORM_CONFIG[p]);

  // Show the most restrictive char limit as the primary counter
  const tightestLimit = useMemo(() => {
    if (activePlatforms.length === 0) return 2200;
    return Math.min(
      ...activePlatforms.map((p) => PLATFORM_CONFIG[p].charLimit)
    );
  }, [activePlatforms]);

  const overLimit = content.length > tightestLimit;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label htmlFor="reel-caption" className="text-sm font-medium">
          Caption
        </label>
        <span
          className={`text-xs tabular-nums ${
            overLimit ? "text-destructive font-medium" : "text-muted-foreground"
          }`}
        >
          {content.length.toLocaleString()}/{tightestLimit.toLocaleString()}
        </span>
      </div>

      <textarea
        id="reel-caption"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What's this reel about? Use #hashtags to boost discovery…"
        rows={5}
        disabled={locked}
        className="w-full bg-background border border-border/60 focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10 rounded-lg px-3.5 py-3 text-[14px] leading-[1.6] outline-none transition-colors resize-y disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Minimal stat row — no icons shouting */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground tabular-nums">
        <Stat icon={Hash} value={hashtagCount} label="hashtags" active={hashtagCount > 0} />
        <Stat icon={AtSign} value={mentionCount} label="mentions" active={mentionCount > 0} />
        <Stat icon={Link2} value={linkCount} label="links" active={linkCount > 0} />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  active,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        active ? "text-foreground" : ""
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {value} {label}
    </span>
  );
}
