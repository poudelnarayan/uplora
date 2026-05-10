"use client";

import { Lock } from "lucide-react";
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

type Props = {
  /** Lower-case platform key (e.g. "youtube"). */
  platform: string;
  /** What the disabled button would have said, e.g. "Publish to YouTube". */
  label?: string;
  /** Optional override for the explanatory paragraph. */
  hint?: string;
  /** Caller's role — controls whether the hint addresses the owner or editor. */
  role?: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER" | string | null;
  /** Optional team name to mention in the hint. */
  teamName?: string | null;
  /** Visual size to roughly match neighboring buttons. */
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Looks like a disabled primary button with a short explanatory paragraph
 * underneath. Used everywhere a publish/connect action is available in the
 * UI but the active team's owner hasn't enabled the platform.
 *
 * Uses `aria-disabled` (not the disabled attribute) so screen readers can
 * still focus and read the explanation. The visible button is non-interactive.
 */
export function DisabledPlatformButton({
  platform,
  label,
  hint,
  role,
  teamName,
  size = "md",
  className = "",
}: Props) {
  const platformLabel = LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  const buttonLabel = label || `Publish to ${platformLabel}`;

  const isOwner = role === "OWNER";
  const defaultHint = isOwner
    ? `Enable ${platformLabel} from Team settings → Platform Access${teamName ? ` for "${teamName}"` : ""}.`
    : `Your team owner hasn't enabled ${platformLabel} for this team yet — ask them to add it under Team settings → Platform Access.`;

  const sizeCls =
    size === "sm" ? "h-9 px-3 text-xs" :
    size === "lg" ? "h-12 px-5 text-base" :
                    "h-10 px-4 text-sm";

  return (
    <div className={cn("space-y-1.5", className)}>
      <button
        type="button"
        aria-disabled="true"
        tabIndex={0}
        onClick={(e) => e.preventDefault()}
        title={defaultHint}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl font-semibold",
          "bg-muted text-muted-foreground border border-dashed border-border",
          "cursor-not-allowed opacity-80",
          "select-none",
          sizeCls,
        )}
      >
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{buttonLabel}</span>
      </button>
      <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug px-0.5">
        {hint || defaultHint}
      </p>
    </div>
  );
}
