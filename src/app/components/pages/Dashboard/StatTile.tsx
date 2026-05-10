"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  Icon: LucideIcon;
  /** When set, the tile becomes a toggleable filter chip. */
  onClick?: () => void;
  /** Visually mark the tile as the active filter. */
  active?: boolean;
  /** Tailwind utility classes for the icon's color/background, e.g. `bg-emerald-500/10 text-emerald-600` */
  tone?: string;
};

/**
 * Compact stat tile that doubles as a status filter when `onClick` is provided.
 * Clicking the same tile twice clears the filter (parent decides).
 *
 * Designed mobile-first: the value is the dominant element, hint truncates.
 */
export function StatTile({ label, value, hint, Icon, onClick, active, tone }: Props) {
  const isInteractive = !!onClick;

  const Cmp: any = isInteractive ? "button" : "div";

  return (
    <Cmp
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "w-full text-left rounded-xl border bg-card transition-all",
        "p-3 sm:p-4",
        isInteractive && "hover:shadow-sm hover:border-primary/40 active:scale-[0.99]",
        active
          ? "border-primary/50 ring-2 ring-primary/15 bg-primary/5"
          : "border-border/60",
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0",
            tone || "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight tabular-nums">
              {value}
            </p>
            {hint && (
              <span className="text-xs text-muted-foreground/80 truncate hidden sm:inline">
                {hint}
              </span>
            )}
          </div>
        </div>
      </div>
    </Cmp>
  );
}
