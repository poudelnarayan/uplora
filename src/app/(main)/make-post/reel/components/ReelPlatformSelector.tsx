"use client";

import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "Instagram", label: "Instagram",      hint: "5 hashtags · 2,200 chars" },
  { id: "TikTok",    label: "TikTok",          hint: "4,000 chars · links OK" },
  { id: "YouTube",   label: "YouTube Shorts",  hint: "15 hashtags · 5,000 chars" },
  { id: "Facebook",  label: "Facebook",        hint: "Links not clickable" },
];

interface ReelPlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

export default function ReelPlatformSelector({ selected, onChange }: ReelPlatformSelectorProps) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(p => p !== id) : [...selected, id]);

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-[0px_30px_60px_rgba(0,88,190,0.04)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Platforms</h3>
        <span className="text-[0.7rem] font-semibold text-muted-foreground/50">{selected.length} selected</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map(({ id, label, hint }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "group flex flex-col items-start gap-1 px-5 py-4 rounded-2xl text-left transition-all border-2 select-none",
                active
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-surface-container-low border-transparent hover:border-primary/20 hover:bg-primary/[0.03]"
              )}
            >
              <div className="flex items-center gap-2.5 w-full">
                {/* checkbox dot */}
                <span className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  active ? "bg-white border-white" : "border-muted-foreground/30"
                )}>
                  {active && (
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="hsl(var(--primary))" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={cn(
                  "font-bold text-sm leading-tight",
                  active ? "text-white" : "text-foreground"
                )}>
                  {label}
                </span>
              </div>
              <span className={cn(
                "text-[0.62rem] font-medium leading-snug pl-[1.625rem]",
                active ? "text-white/65" : "text-muted-foreground/60"
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
