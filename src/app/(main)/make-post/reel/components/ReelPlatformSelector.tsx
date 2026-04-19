"use client";

import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "Instagram",  label: "Instagram",      hint: "5 hashtags · 2,200 chars" },
  { id: "TikTok",     label: "TikTok",          hint: "4,000 chars · links OK" },
  { id: "YouTube",    label: "YouTube Shorts",  hint: "15 hashtags · 5,000 chars" },
  { id: "Facebook",   label: "Facebook",        hint: "Links not clickable" },
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
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-primary">Platforms</span>
        <span className="text-[0.65rem] text-muted-foreground/50 font-medium">{selected.length} selected</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map(({ id, label, hint }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "flex flex-col items-start gap-0.5 px-3.5 py-3 rounded-xl border transition-all text-left select-none",
                active
                  ? "bg-primary border-primary text-white shadow-md shadow-primary/15"
                  : "bg-background border-border/50 hover:border-primary/30 hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  active ? "bg-white border-white" : "border-muted-foreground/40"
                )}>
                  {active && (
                    <svg viewBox="0 0 10 10" className="w-2 h-2">
                      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={cn(
                  "font-semibold text-xs leading-tight",
                  active ? "text-white" : "text-foreground"
                )}>
                  {label}
                </span>
              </div>
              <span className={cn(
                "text-[0.6rem] leading-snug pl-5",
                active ? "text-white/60" : "text-muted-foreground/50"
              )}>
                {hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
