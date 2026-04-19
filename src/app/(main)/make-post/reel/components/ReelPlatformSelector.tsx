"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const PLATFORMS = [
  { id: "Instagram",  label: "Instagram",      shortLabel: "IG",  hint: "5 hashtags · 2,200 chars" },
  { id: "TikTok",     label: "TikTok",          shortLabel: "TK",  hint: "4,000 chars · links OK" },
  { id: "YouTube",    label: "YouTube Shorts",  shortLabel: "YT",  hint: "15 hashtags · 5,000 chars" },
  { id: "Facebook",   label: "Facebook",        shortLabel: "FB",  hint: "Links not clickable" },
];

interface ReelPlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

export default function ReelPlatformSelector({ selected, onChange }: ReelPlatformSelectorProps) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(p => p !== id) : [...selected, id]);

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          Platforms
        </span>
        <span className="text-[0.65rem] text-muted-foreground/50 font-medium tabular-nums">
          {selected.length} of {PLATFORMS.length} selected
        </span>
      </div>

      {/* Pills / Cards — horizontal on lg+, 2-col grid on smaller */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(({ id, label, shortLabel, hint }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-left select-none group",
                active
                  ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/15"
                  : "bg-background border-border/50 hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              {/* Checkbox indicator */}
              <span className={cn(
                "w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 border",
                active
                  ? "bg-white/20 border-white/30"
                  : "bg-muted/40 border-border/60 group-hover:border-primary/40"
              )}>
                {active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>

              {/* Label + hint */}
              <div className="min-w-0">
                <span className={cn(
                  "font-semibold text-xs leading-tight block",
                  active ? "text-white" : "text-foreground"
                )}>
                  {label}
                </span>
                <span className={cn(
                  "text-[0.6rem] leading-snug block",
                  active ? "text-white/50" : "text-muted-foreground/40"
                )}>
                  {hint}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
