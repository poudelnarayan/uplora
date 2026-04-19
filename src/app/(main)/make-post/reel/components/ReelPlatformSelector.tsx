"use client";

import { cn } from "@/lib/utils";

const PLATFORMS = [
  {
    id: "Instagram",
    label: "Instagram",
    hint: "5 tags · 2.2k chars",
    color: "from-pink-500 to-purple-600",
  },
  {
    id: "TikTok",
    label: "TikTok",
    hint: "4k chars · links OK",
    color: "from-neutral-900 to-neutral-700",
  },
  {
    id: "YouTube",
    label: "YouTube Shorts",
    hint: "15 tags · 5k chars",
    color: "from-red-500 to-red-600",
  },
  {
    id: "Facebook",
    label: "Facebook",
    hint: "480 visible · no links",
    color: "from-blue-600 to-blue-700",
  },
];

interface ReelPlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

export default function ReelPlatformSelector({ selected, onChange }: ReelPlatformSelectorProps) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(p => p !== id) : [...selected, id]);

  return (
    <div className="bg-white p-10 rounded-[2rem] shadow-[0px_30px_60px_rgba(0,88,190,0.04)]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Target Platforms</h3>
        <span className="text-[0.7rem] font-bold text-muted-foreground/50">
          {selected.length} selected
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {PLATFORMS.map(({ id, label, hint }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "flex flex-col items-start gap-1.5 px-6 py-5 rounded-2xl cursor-pointer transition-all text-left select-none border-2",
                active
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-surface-container-low border-transparent hover:border-primary/20 hover:bg-primary/[0.03]"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  active ? "bg-white border-white" : "border-muted-foreground/30"
                )}>
                  {active && (
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="hsl(var(--primary))" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={cn(
                  "font-bold text-sm",
                  active ? "text-white" : "text-foreground"
                )}>
                  {label}
                </span>
              </div>
              <span className={cn(
                "text-[0.65rem] font-semibold pl-7",
                active ? "text-white/70" : "text-muted-foreground/60"
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
