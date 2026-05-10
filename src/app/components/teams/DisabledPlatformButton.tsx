"use client";

import { Lock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  threads: "Threads",
  tiktok: "TikTok",
  telegram: "Telegram",
};

type Role = "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER" | string | null | undefined;

function defaultHint(platformLabel: string, role: Role, teamName?: string | null) {
  if (role === "OWNER") {
    return `Enable ${platformLabel} from Team settings → Platform Access${teamName ? ` for "${teamName}"` : ""}.`;
  }
  // Editor / Manager / member side — different tone, ends with action they can take
  return `Your team owner hasn't enabled ${platformLabel} for this team yet — ask them to enable it from Team settings → Platform Access.`;
}

// ──────────────────────────────────────────────────────────────────────────
// Single disabled button (with its own paragraph). Use when there's exactly
// one locked action; for two-or-more, use <DisabledPlatformGroup> below.
// ──────────────────────────────────────────────────────────────────────────
type ButtonProps = {
  platform: string;
  label?: string;
  hint?: string;
  role?: Role;
  teamName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** When true, renders the button alone with no paragraph below. Use when
   *  the explanation lives once on a parent group. */
  buttonOnly?: boolean;
};

export function DisabledPlatformButton({
  platform, label, hint, role, teamName, size = "md", className = "", buttonOnly = false,
}: ButtonProps) {
  const platformLabel = LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  const buttonLabel = label || `Publish to ${platformLabel}`;
  const explanation = hint || defaultHint(platformLabel, role, teamName);

  const sizeCls =
    size === "sm" ? "h-9 px-3 text-xs" :
    size === "lg" ? "h-12 px-5 text-base" :
                    "h-10 px-4 text-sm";

  const button = (
    <button
      type="button"
      aria-disabled="true"
      tabIndex={0}
      onClick={(e) => e.preventDefault()}
      title={explanation}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl font-semibold",
        "bg-muted text-muted-foreground border border-dashed border-border",
        "cursor-not-allowed opacity-80 select-none",
        sizeCls,
      )}
    >
      <Lock className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{buttonLabel}</span>
    </button>
  );

  if (buttonOnly) {
    return <div className={cn("w-full", className)}>{button}</div>;
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {button}
      <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug px-0.5">
        {explanation}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Group: shared notice + N disabled buttons inside. The reason text shows
// once at the top, regardless of how many buttons are in the group.
// ──────────────────────────────────────────────────────────────────────────
type GroupProps = {
  platform: string;
  /** Custom explanation. If omitted, uses the role-aware default. */
  hint?: string;
  role?: Role;
  teamName?: string | null;
  className?: string;
  children: React.ReactNode;
};

export function DisabledPlatformGroup({
  platform, hint, role, teamName, className = "", children,
}: GroupProps) {
  const platformLabel = LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  const explanation = hint || defaultHint(platformLabel, role, teamName);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {children}
      </div>
      <div className="flex items-start gap-1.5 px-0.5">
        <Info className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
          {explanation}
        </p>
      </div>
    </div>
  );
}
