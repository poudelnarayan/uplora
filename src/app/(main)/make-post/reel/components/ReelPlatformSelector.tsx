"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "Instagram", label: "Instagram", hint: "Reels · 2,200 chars" },
  { id: "TikTok", label: "TikTok", hint: "4,000 chars · links OK" },
  { id: "YouTube", label: "YouTube Shorts", hint: "15 hashtag max" },
  { id: "Facebook", label: "Facebook", hint: "Links not clickable" },
];

interface ReelPlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
  locked?: boolean;
}

export default function ReelPlatformSelector({
  selected,
  onChange,
  locked,
}: ReelPlatformSelectorProps) {
  const toggle = (id: string) => {
    if (locked) return;
    onChange(
      selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]
    );
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-medium">Platforms</h3>
        <span className="text-xs text-muted-foreground">
          {selected.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PLATFORMS.map(({ id, label, hint }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              disabled={locked}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                active
                  ? "bg-background border-foreground"
                  : "bg-background border-border/60 hover:border-border"
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded grid place-items-center shrink-0 transition-colors",
                  active
                    ? "bg-foreground border border-foreground"
                    : "border border-border"
                )}
              >
                {active && <Check className="h-3 w-3 text-background" strokeWidth={3} />}
              </span>
              <span className="flex flex-col leading-tight min-w-0">
                <span className="text-[13px] font-medium truncate">{label}</span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
