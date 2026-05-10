"use client";

import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
import { useTeamPlatforms } from "@/hooks/use-team-platforms";

const PLATFORMS = [
  { id: "Instagram",  label: "Instagram",      shortLabel: "IG",  hint: "5 hashtags · 2,200 chars", key: "instagram" },
  { id: "TikTok",     label: "TikTok",          shortLabel: "TK",  hint: "4,000 chars · links OK",  key: "tiktok"    },
  { id: "YouTube",    label: "YouTube Shorts",  shortLabel: "YT",  hint: "15 hashtags · 5,000 chars", key: "youtube" },
  { id: "Facebook",   label: "Facebook",        shortLabel: "FB",  hint: "Links not clickable",     key: "facebook"  },
] as const;

interface ReelPlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

export default function ReelPlatformSelector({ selected, onChange }: ReelPlatformSelectorProps) {
  // Use the active workspace's allowlist. Personal workspace = all enabled.
  const { isPersonal, has, team } = useTeamPlatforms();
  const isLocked = (key: string) => !isPersonal && !has(key as any);

  const toggle = (id: string) => {
    const def = PLATFORMS.find((p) => p.id === id);
    // Refuse to add a locked platform — mirrors the server guard.
    if (def && isLocked(def.key) && !selected.includes(id)) return;
    onChange(selected.includes(id) ? selected.filter(p => p !== id) : [...selected, id]);
  };

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
        {PLATFORMS.map(({ id, label, hint, key }) => {
          const active = selected.includes(id);
          const locked = isLocked(key);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              disabled={locked}
              aria-disabled={locked}
              title={
                locked
                  ? `Not enabled for ${team?.name || "this team"}. Ask the team owner to enable ${label} under Team settings → Platform Access.`
                  : undefined
              }
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-left select-none group",
                locked
                  ? "bg-muted/40 border-dashed border-border/60 text-muted-foreground/60 cursor-not-allowed opacity-70"
                  : active
                    ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/15"
                    : "bg-background border-border/50 hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              {/* Checkbox indicator (or lock icon when locked) */}
              <span className={cn(
                "w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 border",
                locked
                  ? "bg-muted border-border/60"
                  : active
                    ? "bg-white/20 border-white/30"
                    : "bg-muted/40 border-border/60 group-hover:border-primary/40"
              )}>
                {locked
                  ? <Lock className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={2.5} />
                  : active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>

              {/* Label + hint */}
              <div className="min-w-0">
                <span className={cn(
                  "font-semibold text-xs leading-tight block",
                  locked ? "text-muted-foreground/70" : active ? "text-white" : "text-foreground"
                )}>
                  {label}
                </span>
                <span className={cn(
                  "text-[0.6rem] leading-snug block",
                  locked
                    ? "text-muted-foreground/50 italic"
                    : active ? "text-white/50" : "text-muted-foreground/40"
                )}>
                  {locked ? "Not enabled for this team" : hint}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
