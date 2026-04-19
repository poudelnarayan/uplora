"use client";

import { useMemo } from "react";
import { AlertTriangle, Info, Link2, Hash, AtSign } from "lucide-react";

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

const PLATFORM_SHORT: Record<string, string> = {
  Instagram: "IG",
  Facebook: "FB",
  TikTok: "TK",
  YouTube: "YT",
};

function countHashtags(text: string) {
  return (text.match(/#\w+/g) || []).length;
}

function countMentions(text: string) {
  return (text.match(/@\w+/g) || []).length;
}

function extractLinks(text: string) {
  return (text.match(/https?:\/\/[^\s]+/g) || []);
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
  const links = useMemo(() => extractLinks(content), [content]);
  const hasLinks = links.length > 0;

  const activePlatforms = selectedPlatforms.filter(p => PLATFORM_CONFIG[p]);

  const platformWarnings = useMemo(() => {
    const warnings: { platform: string; message: string; type: "warn" | "error" | "info" }[] = [];

    for (const pid of activePlatforms) {
      const cfg = PLATFORM_CONFIG[pid];
      if (!cfg) continue;

      if (content.length > cfg.charLimit) {
        warnings.push({
          platform: pid,
          message: `Over ${cfg.charLimit.toLocaleString()} char limit by ${content.length - cfg.charLimit}`,
          type: "error",
        });
      }

      if (cfg.hashtagLimit !== null) {
        if (hashtagCount > cfg.hashtagLimit) {
          warnings.push({
            platform: pid,
            message: pid === "YouTube"
              ? `${hashtagCount} hashtags — YouTube ignores ALL if > 15`
              : `${hashtagCount} hashtags — Instagram only shows first 5 (Dec 2025)`,
            type: "error",
          });
        }
      }

      if (hasLinks && !cfg.linksClickable) {
        warnings.push({
          platform: pid,
          message: `Links are NOT clickable on ${pid} (bio link only)`,
          type: "warn",
        });
      }

      if (cfg.visibleChars !== null && content.length > cfg.visibleChars) {
        warnings.push({
          platform: pid,
          message: `Only first ${cfg.visibleChars} chars visible before "...more"`,
          type: "info",
        });
      }
    }

    return warnings;
  }, [activePlatforms, content, hashtagCount, hasLinks]);

  const igVisiblePreview = useMemo(() => {
    if (!selectedPlatforms.includes("Instagram") || !content) return null;
    if (content.length <= 55) return null;
    return content.slice(0, 55);
  }, [content, selectedPlatforms]);

  return (
    <div className="space-y-5">
      {/* Label + counters — stacked so counters never fight the label for space */}
      <div className="space-y-2">
        <label className="block text-xs font-black text-primary uppercase tracking-[0.2em]">
          Caption &amp; Story
        </label>
        {activePlatforms.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {activePlatforms.map(pid => {
              const cfg = PLATFORM_CONFIG[pid];
              if (!cfg) return null;
              const over = content.length > cfg.charLimit;
              return (
                <span
                  key={pid}
                  className={`px-3 py-1 rounded-lg text-[0.62rem] font-black uppercase whitespace-nowrap transition-colors ${
                    over
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/5 text-primary"
                  }`}
                >
                  {PLATFORM_SHORT[pid]}: {content.length.toLocaleString()}/{cfg.charLimit.toLocaleString()}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={e => onChange(e.target.value)}
        placeholder="What's this reel about? Use #hashtags and @mentions to increase reach..."
        rows={7}
        disabled={locked}
        className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/20 rounded-2xl px-8 py-6 text-foreground font-medium focus:ring-0 transition-all outline-none resize-none leading-relaxed text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap text-[0.72rem] text-muted-foreground">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Hash className="h-3.5 w-3.5 text-primary/60 shrink-0" />
          <span className={hashtagCount > 0 ? "text-foreground font-semibold" : ""}>{hashtagCount} hashtags</span>
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <AtSign className="h-3.5 w-3.5 text-primary/60 shrink-0" />
          <span className={mentionCount > 0 ? "text-foreground font-semibold" : ""}>{mentionCount} mentions</span>
        </span>
        {hasLinks && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Link2 className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <span className="text-foreground font-semibold">{links.length} link{links.length > 1 ? "s" : ""}</span>
          </span>
        )}
        <span className="text-muted-foreground/50 whitespace-nowrap">{content.length} chars</span>
      </div>

      {/* IG first-55-char preview */}
      {igVisiblePreview && (
        <div className="rounded-2xl border border-pink-200 bg-pink-50/60 px-5 py-4">
          <p className="text-[0.68rem] font-black text-pink-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Instagram visible preview (first 55 chars)
          </p>
          <p className="text-sm text-gray-700 font-medium">
            {igVisiblePreview}
            <span className="text-pink-400 font-bold">… more</span>
          </p>
        </div>
      )}

      {/* Platform warnings */}
      {platformWarnings.length > 0 && (
        <div className="space-y-2">
          {platformWarnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-5 py-3.5 rounded-2xl text-[0.75rem] font-semibold ${
                w.type === "error"
                  ? "bg-destructive/8 text-destructive border border-destructive/15"
                  : w.type === "warn"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-black">{w.platform}: </span>
                {w.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hashtag best practices tips (only when platforms selected) */}
      {activePlatforms.length > 0 && hashtagCount === 0 && content.length > 20 && (
        <div className="flex items-start gap-3 px-5 py-3.5 rounded-2xl bg-primary/4 border border-primary/10 text-[0.73rem] text-primary/70">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Add <span className="font-black">#hashtags</span> to boost discovery.
            {selectedPlatforms.includes("Instagram") && " Instagram: max 5 recommended (Dec 2025)."}
            {selectedPlatforms.includes("YouTube") && " YouTube: max 15 — exceeding ignores all."}
          </span>
        </div>
      )}
    </div>
  );
}
