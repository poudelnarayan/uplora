import React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * Loaders & skeletons
 *
 * One visual language across the app: rounded shimmer surfaces over
 * `bg-muted` for skeletons, hairline ring + colored arc for spinners.
 * Each page-level skeleton mirrors the rough shape of what's about to
 * appear so the layout doesn't jump when data lands.
 *
 * Sidebar policy:
 * - Page-level skeletons assume they render INSIDE <AppShell>, which
 *   provides the sidebar shell (it doesn't depend on team data).
 * - For pre-shell loads (auth checks, suspense fallbacks before the
 *   shell mounts), use <AppShellSkeleton> which fakes a sidebar.
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
        <p className={cn("text-sm font-medium text-muted-foreground")}>{text}</p>
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
 * Skeleton primitives
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

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("rounded-xl border border-border/60 bg-card overflow-hidden", className)}>
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
            style={{ flexBasis: `${[60, 80, 70, 90][colIndex % 4]}%` } as React.CSSProperties}
          />
        ))}
      </div>
    ))}
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Page-level skeletons (mount inside <AppShell>)
 * Each one mirrors the actual page so layout doesn't jump on data arrival.
 * ────────────────────────────────────────────────────────────────────── */

const PageWrap: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6", className)}>
    {children}
  </div>
);

/** Dashboard: greeting hero + stat tiles + needs-attention + content grid. */
export const DashboardSkeleton: React.FC = () => (
  <PageWrap>
    {/* Hero */}
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 space-y-3">
      <Skeleton className="h-6 w-48 sm:w-64" />
      <Skeleton className="h-4 w-72 sm:w-96 max-w-full" />
      <div className="flex flex-wrap gap-2 pt-2">
        <Skeleton className="h-9 w-32" rounded="lg" />
        <Skeleton className="h-9 w-24" rounded="lg" />
      </div>
    </div>

    {/* Stat tiles */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-7" rounded="md" />
          </div>
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>

    {/* Needs attention */}
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 min-w-0 rounded-lg border border-border/40 p-3 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>

    {/* Filter row */}
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" rounded="lg" />
        <Skeleton className="h-8 w-20" rounded="lg" />
        <Skeleton className="h-8 w-20" rounded="lg" />
      </div>
      <Skeleton className="h-8 w-28" rounded="lg" />
    </div>

    {/* Content grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </PageWrap>
);

/** Posts grid (all/posted/scheduled): header + chips + responsive card grid. */
export const PostsGridSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => (
  <div className="relative lg:fixed lg:inset-0 lg:left-64 bg-background lg:overflow-auto">
    {/* Sticky header */}
    <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/95 lg:sticky lg:top-0 lg:z-10">
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <Skeleton className="h-7 w-32 sm:w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 hidden sm:block" rounded="lg" />
          <Skeleton className="h-9 w-24" rounded="lg" />
        </div>
      </div>
      {/* Filter chips */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0" rounded="full" />
        ))}
      </div>
    </div>
    {/* Grid */}
    <div className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

/** Timeline: header + 7 day pills + stacked list of posts. */
export const TimelineSkeleton: React.FC = () => (
  <div className="relative lg:fixed lg:inset-0 lg:left-64 bg-background lg:overflow-auto">
    <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/95 lg:sticky lg:top-0 lg:z-10">
      <div className="flex items-center justify-between gap-2 mb-3">
        <Skeleton className="h-7 w-28 sm:w-36" />
        <Skeleton className="h-9 w-28" rounded="lg" />
      </div>
      {/* Day pills */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-16 shrink-0" rounded="lg" />
        ))}
      </div>
    </div>
    <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-border/60 bg-card p-3 sm:p-4">
          <Skeleton className="h-16 w-24 sm:h-20 sm:w-32 shrink-0" rounded="lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-16" rounded="full" />
            </div>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Detail page: header + large media + side editor (video/text/image/reel/posts/[id]). */
export const DetailSkeleton: React.FC<{ media?: "video" | "image" | "text" | "reel" }> = ({
  media = "video",
}) => {
  const aspect =
    media === "reel" ? "aspect-[9/16] max-w-xs" :
    media === "image" ? "aspect-square" :
    media === "text" ? "aspect-[4/3]" :
                       "aspect-video";

  return (
    <PageWrap>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Skeleton className="h-9 w-9" rounded="lg" />
          <Skeleton className="h-6 w-40 sm:w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 hidden sm:block" rounded="lg" />
          <Skeleton className="h-9 w-24" rounded="lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Player / media */}
        <div className="lg:col-span-5 order-1 space-y-3">
          <div className={cn("w-full mx-auto", aspect)}>
            <Skeleton className="w-full h-full" rounded="lg" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10" rounded="lg" />
            <Skeleton className="h-10" rounded="lg" />
          </div>
          <Skeleton className="h-12" rounded="lg" />
        </div>

        {/* Editor / metadata */}
        <div className="lg:col-span-7 order-2 space-y-3">
          <Skeleton className="h-6 w-24" rounded="full" />
          <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" rounded="lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-24 w-full" rounded="lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-16" rounded="full" />
                <Skeleton className="h-7 w-20" rounded="full" />
                <Skeleton className="h-7 w-14" rounded="full" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-border/40">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" rounded="lg" />
            </div>
          </div>
        </div>
      </div>
    </PageWrap>
  );
};

/** Make-post editor: form-style with sections, used inside Suspense. */
export const MakePostSkeleton: React.FC = () => (
  <PageWrap>
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-9 w-24" rounded="lg" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-7 space-y-3">
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="aspect-video w-full" rounded="lg" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10" rounded="lg" />
            <Skeleton className="h-10" rounded="lg" />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" rounded="lg" />
          <Skeleton className="h-24 w-full" rounded="lg" />
        </div>
      </div>
      <div className="lg:col-span-5 space-y-3">
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" rounded="lg" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" rounded="lg" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </div>
      </div>
    </div>
  </PageWrap>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Pre-shell loader: sidebar + content area placeholder for cases where
 * <AppShell> can't yet mount (auth checks, top-level Suspense).
 * ────────────────────────────────────────────────────────────────────── */

export const AppShellSkeleton: React.FC<{ children?: React.ReactNode; text?: string }> = ({
  children,
  text,
}) => (
  <div className="flex h-screen bg-background">
    {/* Fake sidebar — desktop only */}
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border overflow-hidden">
      <div className="h-16 border-b border-sidebar-border flex items-center px-4">
        <Skeleton className="h-8 w-32" rounded="md" />
      </div>
      <div className="px-3 py-4 border-b border-sidebar-border">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-9 w-full" rounded="lg" />
      </div>
      <nav className="flex-1 px-3 py-3 space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-5 w-5" rounded="md" />
            <Skeleton className="h-4 flex-1 max-w-[120px]" />
          </div>
        ))}
        <div className="my-6 mx-3 border-t border-sidebar-border pt-4" />
        <div className="px-3 pb-2">
          <Skeleton className="h-3 w-12" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-5 w-5" rounded="md" />
            <Skeleton className="h-4 flex-1 max-w-[100px]" />
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" rounded="full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      </div>
    </aside>

    {/* Mobile top bar */}
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-3 z-40">
      <Skeleton className="h-9 w-9" rounded="md" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-9 w-9" rounded="full" />
    </div>

    {/* Content area */}
    <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 overflow-auto">
      {children ?? (
        <div className="p-6 sm:p-10 flex flex-col items-center justify-center gap-3 min-h-[60vh]">
          <InlineSpinner size="md" className="text-primary" />
          {text && <span className="text-sm text-muted-foreground">{text}</span>}
        </div>
      )}
    </main>
  </div>
);

/**
 * Generic page loader — kept for backward compatibility with components
 * that import it. Renders a sidebar + dashboard-shaped skeleton so it's
 * safe to use anywhere without a layout-jump.
 */
export const PageLoader: React.FC<{ text?: string }> = ({ text }) => (
  <AppShellSkeleton text={text}>
    <DashboardSkeleton />
  </AppShellSkeleton>
);

/** Compact full-screen overlay — workspace switches, etc. */
export const OverlayLoader: React.FC<{ text?: string }> = ({ text = "One moment…" }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-sm">
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-5 py-3 shadow-lg">
      <InlineSpinner size="sm" className="text-primary" />
      <span className="text-sm font-medium text-foreground">{text}</span>
    </div>
  </div>
);

export default LoadingSpinner;
