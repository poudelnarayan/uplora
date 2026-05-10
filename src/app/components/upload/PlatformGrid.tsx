"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { platformIcons } from "@/app/components/teams/PlatformIcon";

// Platform brand colors used as active-state backgrounds. These are kept
// subtle (no gradients, no pure neutrals) so the row feels lively without
// fighting the rest of the UI. Inactive icons render in the same brand
// color but at low opacity so the row is a single visual scan.
const BRAND: Record<string, { active: string; icon: string }> = {
  instagram: { active: "bg-pink-500 hover:bg-pink-500",   icon: "text-pink-600 dark:text-pink-400"   },
  facebook:  { active: "bg-blue-600 hover:bg-blue-600",   icon: "text-blue-600 dark:text-blue-400"   },
  twitter:   { active: "bg-foreground hover:bg-foreground", icon: "text-foreground"                  },
  linkedin:  { active: "bg-sky-700 hover:bg-sky-700",     icon: "text-sky-700 dark:text-sky-400"     },
  pinterest: { active: "bg-rose-600 hover:bg-rose-600",   icon: "text-rose-600 dark:text-rose-400"   },
  threads:   { active: "bg-foreground hover:bg-foreground", icon: "text-foreground"                  },
  tiktok:    { active: "bg-foreground hover:bg-foreground", icon: "text-foreground"                  },
  youtube:   { active: "bg-red-600 hover:bg-red-600",     icon: "text-red-600 dark:text-red-400"     },
};

export type PlatformGridItem = {
  id: string;       // display id used in selected[] (e.g. "X (Twitter)")
  label: string;    // human label
  key: string;      // normalized key matching platformIcons / allowlist
  limit: number;    // char limit (shown on hover via title)
};

type Props = {
  items: PlatformGridItem[];
  selected: string[];
  onToggle: (id: string) => void;
  isLocked?: (key: string) => boolean;
  teamName?: string | null;
  /** Optional title shown above the grid. Defaults to "Platforms". */
  label?: string;
};

/**
 * Compact icon-first platform picker. Replaces the older 100px-wide
 * label-and-subtitle pills with 40×40 brand-colored squares so the whole
 * row fits in one line on most phones, and reads at a glance on desktop.
 *
 * - Inactive: card bg + brand-colored icon
 * - Active: brand-colored bg + white icon + small check badge
 * - Locked: muted bg + lock badge, dashed border (workspace allowlist)
 */
export function PlatformGrid({
  items, selected, onToggle, isLocked, teamName, label = "Platforms",
}: Props) {
  const total = items.length;
  const activeCount = items.filter((p) => selected.includes(p.id)).length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">{label}</span>
        <span className="text-[0.65rem] text-muted-foreground/60 font-medium tabular-nums">
          {activeCount} / {total}
        </span>
      </div>

      {/* Outer pt-2 + pr-2 give the corner badges (-top-2/-right-2) room
          to breathe instead of clipping into adjacent tiles or the card
          edge. Gap-3 keeps tiles cleanly separated even with badges. */}
      <div className="flex flex-wrap gap-3 pt-2 pr-2">
        {items.map(({ id, label: name, key, limit }) => {
          const Icon = (platformIcons as Record<string, React.ComponentType<{ className?: string }>>)[key];
          const active = selected.includes(id);
          const lockedHere = !!isLocked?.(key);
          const brand = BRAND[key] ?? { active: "bg-foreground hover:bg-foreground", icon: "text-foreground" };

          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              disabled={lockedHere}
              aria-pressed={active}
              aria-label={`${name}${lockedHere ? " (not enabled)" : active ? " (selected)" : ""}`}
              title={
                lockedHere
                  ? `${name} — not enabled for ${teamName || "this workspace"}`
                  : `${name} · ${limit.toLocaleString()} char limit`
              }
              className={cn(
                "relative h-11 w-11 sm:h-10 sm:w-10 rounded-xl border flex items-center justify-center transition-all duration-150 select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                "active:scale-[0.94]",
                lockedHere
                  ? "bg-muted/40 border-dashed border-border/60 cursor-not-allowed"
                  : active
                    ? `${brand.active} border-transparent text-white shadow-sm`
                    : `bg-card border-border/60 hover:border-border ${brand.icon}`,
              )}
            >
              {Icon ? (
                <Icon className={cn("h-5 w-5", lockedHere && "opacity-40")} />
              ) : (
                <span className="text-xs font-semibold">{name.slice(0, 2)}</span>
              )}

              {/* Active check badge — pulled outside the tile with a card-
                  colored ring so it always reads cleanly even on a busy
                  background. */}
              {active && !lockedHere && (
                <span className="absolute -top-2 -right-2 h-[18px] w-[18px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm ring-2 ring-card">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              {/* Locked badge */}
              {lockedHere && (
                <span className="absolute -top-2 -right-2 h-[18px] w-[18px] rounded-full bg-muted-foreground/80 text-background flex items-center justify-center shadow-sm ring-2 ring-card">
                  <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected platform names — tiny, only when selection exists. Keeps
          the row icon-only without losing the textual confirmation. */}
      {activeCount > 0 && (
        <p className="text-[11px] text-muted-foreground leading-tight">
          {items.filter((p) => selected.includes(p.id)).map((p) => p.label).join(" · ")}
        </p>
      )}
    </div>
  );
}
