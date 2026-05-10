import React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * Loaders & skeletons
 *
 * Design intent:
 * - One visual language across the app: rounded shimmer surfaces over
 *   `bg-muted` for skeletons, hairline ring + colored arc for spinners.
 * - Skeletons mirror the rough shape of what's about to appear so the
 *   layout doesn't jump when data lands.
 * - Page-level loader is composed of skeletons (not a centered spinner)
 *   to feel like progress instead of a loading freeze.
 * ────────────────────────────────────────────────────────────────────── */

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-9 h-9 border-[3px]",
  xl: "w-14 h-14 border-4",
};

const variantClasses = {
  default: "text-muted-foreground border-muted",
  primary: "text-primary border-muted",
  secondary: "text-muted-foreground border-muted",
  success: "text-emerald-600 border-muted",
  warning: "text-amber-600 border-muted",
  error: "text-destructive border-muted",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "primary",
  className,
  text,
  fullScreen = false,
}) => {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-current/20",
          sizeClasses[size],
          variantClasses[variant],
          "border-t-current",
        )}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className={cn("text-sm font-medium text-muted-foreground")}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Inline loading spinner for buttons and small spaces.
 * Uses currentColor so it adapts to whatever button it's inside.
 */
export const InlineSpinner: React.FC<{
  size?: "xs" | "sm" | "md";
  className?: string;
}> = ({ size = "sm", className }) => (
  <div
    className={cn(
      "animate-spin rounded-full border-current/30 border-t-current",
      size === "xs" ? "w-3 h-3 border" : size === "sm" ? "w-4 h-4 border-2" : "w-5 h-5 border-2",
      className,
    )}
    role="status"
    aria-label="Loading"
  />
);

/* ──────────────────────────────────────────────────────────────────────────
 * Skeletons
 *
 * Use these to reserve space for data that's loading. The animation is a
 * subtle horizontal shimmer rather than the default Tailwind pulse, which
 * reads as "actively loading" instead of "broken / empty".
 * ────────────────────────────────────────────────────────────────────── */

const SHIMMER =
  "relative overflow-hidden bg-muted/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.06] before:to-transparent";

export const Skeleton: React.FC<{
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  style?: React.CSSProperties;
}> = ({ className, rounded = "md", style }) => (
  <div
    style={style}
    className={cn(
      SHIMMER,
      rounded === "full" ? "rounded-full" :
      rounded === "xl"   ? "rounded-2xl"   :
      rounded === "lg"   ? "rounded-xl"    :
      rounded === "sm"   ? "rounded"       :
                            "rounded-lg",
      className,
    )}
  />
);

/**
 * Content card skeleton — mirrors the dashboard ContentCard shape so
 * incoming data doesn't shift the layout when it arrives.
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "rounded-xl border border-border/60 bg-card overflow-hidden",
      className,
    )}
  >
    <Skeleton className="aspect-video w-full" rounded="sm" />
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  </div>
);

/**
 * List loading skeleton — matches the visual rhythm of a list of items
 * with avatar + 2 lines.
 */
export const ListSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className,
}) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
        <Skeleton className="h-10 w-10" rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Table loading skeleton.
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ rows = 5, cols = 4, className }) => (
  <div className={cn("rounded-xl border border-border/60 bg-card p-3 sm:p-4", className)}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className={cn("flex gap-3", rowIndex !== 0 && "mt-3 pt-3 border-t border-border/40")}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            className="h-4 flex-1"
            // Random-ish widths produce a believable table without burning
            // a Math.random call per render — keys derive from indexes so
            // layout is stable across re-renders too.
            style={{ flexBasis: `${[60, 80, 70, 90][colIndex % 4]}%` } as React.CSSProperties}
          />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Page loader — used when a route shell is up but data isn't ready.
 * We render a 3-card skeleton grid that matches the typical content
 * page layout, plus a small status line. Far less jarring than a giant
 * centered spinner.
 */
export const PageLoader: React.FC<{ text?: string }> = ({ text = "Loading…" }) => (
  <div className="min-h-[60vh] w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
    <div className="flex items-center gap-3 mb-6">
      <InlineSpinner size="sm" className="text-primary" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

/**
 * Compact full-screen loader — used during one-off overlays like
 * workspace switches where we want to block interaction briefly.
 */
export const OverlayLoader: React.FC<{ text?: string }> = ({ text = "One moment…" }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-sm">
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-5 py-3 shadow-lg">
      <InlineSpinner size="sm" className="text-primary" />
      <span className="text-sm font-medium text-foreground">{text}</span>
    </div>
  </div>
);

export default LoadingSpinner;
