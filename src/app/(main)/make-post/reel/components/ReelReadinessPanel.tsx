"use client";

import { useMemo } from "react";
import { Check, AlertTriangle, Circle } from "lucide-react";

interface Props {
  hasVideo: boolean;
  title: string;
  content: string;
  selectedPlatforms: string[];
}

type CheckState = "ok" | "warn" | "error" | "idle";

interface CheckItem {
  state: CheckState;
  message: string;
}

const PLATFORM_CONFIG = {
  Instagram: { charLimit: 2200, hashtagLimit: 5, linksClickable: false },
  Facebook: { charLimit: 63206, hashtagLimit: null, linksClickable: false },
  TikTok: { charLimit: 4000, hashtagLimit: null, linksClickable: true },
  YouTube: { charLimit: 5000, hashtagLimit: 15, linksClickable: true },
} as const;

export default function ReelReadinessPanel({
  hasVideo,
  title,
  content,
  selectedPlatforms,
}: Props) {
  const checks = useMemo<CheckItem[]>(() => {
    const items: CheckItem[] = [];

    items.push({
      state: hasVideo ? "ok" : "idle",
      message: hasVideo ? "Video uploaded" : "Upload a video to begin",
    });

    items.push({
      state: title.trim() ? "ok" : "idle",
      message: title.trim() ? "Title added" : "Add a title",
    });

    items.push({
      state: content.trim() ? "ok" : "idle",
      message: content.trim() ? "Caption added" : "Write a caption",
    });

    items.push({
      state: selectedPlatforms.length > 0 ? "ok" : "idle",
      message:
        selectedPlatforms.length > 0
          ? `${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? "s" : ""} selected`
          : "Select at least one platform",
    });

    // Platform-specific validation (merged into one list)
    const hashtags = (content.match(/#\w+/g) || []).length;
    const hasLinks = /https?:\/\/[^\s]+/.test(content);

    for (const pid of selectedPlatforms) {
      const cfg = PLATFORM_CONFIG[pid as keyof typeof PLATFORM_CONFIG];
      if (!cfg) continue;

      if (content.length > cfg.charLimit) {
        items.push({
          state: "error",
          message: `${pid}: caption exceeds ${cfg.charLimit.toLocaleString()} char limit`,
        });
      }
      if (cfg.hashtagLimit !== null && hashtags > cfg.hashtagLimit) {
        items.push({
          state: "warn",
          message:
            pid === "YouTube"
              ? `YouTube ignores all hashtags when more than ${cfg.hashtagLimit}`
              : `${pid} only shows first ${cfg.hashtagLimit} hashtags`,
        });
      }
      if (hasLinks && !cfg.linksClickable) {
        items.push({
          state: "warn",
          message: `${pid}: links in captions are not clickable`,
        });
      }
    }

    return items;
  }, [hasVideo, title, content, selectedPlatforms]);

  return (
    <section className="bg-background border border-border/60 rounded-xl p-4">
      <h3 className="text-sm font-medium mb-3">Readiness</h3>
      <ul className="flex flex-col gap-2">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px]">
            <IconFor state={c.state} />
            <span
              className={
                c.state === "error"
                  ? "text-destructive"
                  : c.state === "warn"
                  ? "text-amber-700"
                  : c.state === "ok"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {c.message}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function IconFor({ state }: { state: CheckState }) {
  const base = "h-3.5 w-3.5 mt-0.5 shrink-0";
  if (state === "ok")
    return (
      <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-emerald-600 grid place-items-center shrink-0">
        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
      </span>
    );
  if (state === "error")
    return <AlertTriangle className={`${base} text-destructive`} />;
  if (state === "warn")
    return <AlertTriangle className={`${base} text-amber-600`} />;
  return <Circle className={`${base} text-muted-foreground/40`} />;
}
