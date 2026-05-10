"use client";

import { useState, useEffect, useRef } from "react";
import { Check, FileText, Image as ImageIcon, Video, Play, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "text",  label: "Text",  Icon: FileText  },
  { id: "image", label: "Image", Icon: ImageIcon },
  { id: "reel",  label: "Reel",  Icon: Play      },
  { id: "video", label: "Video", Icon: Video     },
] as const;

const ALL_IDS = TYPES.map((t) => t.id);

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
};

/**
 * Mobile-first content type filter.
 *
 * - Mobile: a single dropdown trigger ("Type: All ▾") with a tap-to-toggle
 *   sheet of checkboxes. Saves vertical space and avoids 5-button stacks.
 * - Desktop: inline chip row (mirrors the same data; no sheet).
 *
 * Multiselect — clearing all == "show all" (matches existing data model).
 */
export function TypeFilter({ selected, onChange }: Props) {
  const allActive = selected.length === 0 || selected.length === TYPES.length;
  const summary = allActive
    ? "All"
    : selected.length === 1
      ? TYPES.find((t) => t.id === selected[0])?.label || "Custom"
      : `${selected.length} types`;

  const toggle = (id: string) => {
    // Treat "all selected" as identical to "none selected" so the user can
    // start trimming from a clean checkbox state.
    const base = selected.length === TYPES.length ? [] : selected;
    const next = base.includes(id) ? base.filter((p) => p !== id) : [...base, id];
    // Empty selection = show all (matches the rest of the app's behavior)
    onChange(next.length === 0 ? ALL_IDS.slice() : next);
  };

  const clear = () => onChange(ALL_IDS.slice());

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      {/* Mobile: dropdown */}
      <div className="sm:hidden relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 h-9 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
          Type: <span className="text-foreground">{summary}</span>
        </button>
        {open && (
          <div
            role="menu"
            className="absolute left-0 top-full mt-1 z-30 w-48 rounded-xl border border-border bg-popover shadow-lg p-1"
          >
            {TYPES.map(({ id, label, Icon }) => {
              const active = !allActive && selected.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    active ? "bg-primary/10 text-foreground" : "hover:bg-muted/40 text-foreground/80",
                  )}
                >
                  <span className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center",
                    active ? "bg-primary border-primary" : "border-border bg-background",
                  )}>
                    {active && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {label}
                </button>
              );
            })}
            {!allActive && (
              <>
                <div className="my-1 border-t border-border/60" />
                <button
                  type="button"
                  onClick={() => { clear(); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted/40"
                >
                  <X className="h-3 w-3" />
                  Clear filter
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Desktop: chip row */}
      <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
        {TYPES.map(({ id, label, Icon }) => {
          const active = !allActive && selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border text-foreground/80 hover:bg-muted/40 hover:border-primary/30",
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}
        {!allActive && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
