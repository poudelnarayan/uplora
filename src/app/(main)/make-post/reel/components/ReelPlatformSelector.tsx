"use client";

import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "Instagram", label: "Instagram" },
  { id: "TikTok",    label: "TikTok" },
  { id: "YouTube",   label: "YouTube" },
  { id: "Facebook",  label: "Facebook" },
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
        <span className="text-[0.7rem] font-bold text-muted-foreground/50">Cross-platform optimization active</span>
      </div>
      <div className="flex flex-wrap gap-4">
        {PLATFORMS.map(({ id, label }) => {
          const active = selected.includes(id);
          return (
            <label
              key={id}
              className={cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all select-none",
                active
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-surface-container-low hover:bg-primary hover:text-white group"
              )}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggle(id)}
                className="w-5 h-5 rounded-full border-none bg-white/20 text-white focus:ring-transparent cursor-pointer"
              />
              <span className={cn(
                "font-bold",
                active ? "text-white" : "text-muted-foreground group-hover:text-white"
              )}>
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
