"use client";

import Link from "next/link";
import { Lock, Settings, Youtube, Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import { useTeamPlatforms, type Platform } from "@/hooks/use-team-platforms";

const ALL_PLATFORMS: Array<{ key: Platform; label: string; Icon: any }> = [
  { key: "youtube",   label: "YouTube",   Icon: Youtube },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "facebook",  label: "Facebook",  Icon: Facebook },
  { key: "twitter",   label: "X",         Icon: Twitter },
  { key: "linkedin",  label: "LinkedIn",  Icon: Linkedin },
  // Generic SVG fallbacks for the rest — keep visual consistency without bloating imports
  { key: "tiktok",    label: "TikTok",    Icon: GenericPlatformIcon("TT") },
  { key: "threads",   label: "Threads",   Icon: GenericPlatformIcon("Th") },
  { key: "pinterest", label: "Pinterest", Icon: GenericPlatformIcon("Pi") },
];

function GenericPlatformIcon(short: string) {
  // eslint-disable-next-line react/display-name
  return ({ className }: { className?: string }) => (
    <span
      className={`inline-flex items-center justify-center text-[9px] font-bold leading-none ${className || ""}`}
      aria-hidden
    >
      {short}
    </span>
  );
}

type Props = {
  /** Override the team to evaluate. Defaults to the active workspace. */
  teamId?: string | null;
  /** Compact (one-line, single chip row). Use above the fold on detail pages. */
  variant?: "default" | "compact";
  /** Hide the "Manage" link to the team settings (e.g. for editors). */
  showManage?: boolean;
  className?: string;
};

/**
 * Inline awareness surface for the per-team platform allowlist.
 *
 * Why this exists: editors used to discover platform restrictions only at the
 * publish step. This banner surfaces the same information up-front so they can
 * plan the work before investing time. Personal workspaces never render — there's
 * nothing to gate.
 */
export function TeamPlatformsBanner({ teamId, variant = "default", showManage = true, className = "" }: Props) {
  const { team, isPersonal, has } = useTeamPlatforms(teamId);

  if (!team || isPersonal) return null;

  const enabledCount = ALL_PLATFORMS.filter((p) => has(p.key)).length;
  const totalCount = ALL_PLATFORMS.length;
  const teamSettingsHref = `/teams?team=${encodeURIComponent(team.id)}`;

  const isOwner = team.role === "OWNER" || (team as any).isOwner === true;

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 flex-wrap text-xs ${className}`}>
        <span className="text-muted-foreground shrink-0">
          Posting to <span className="font-semibold text-foreground">{team.name}</span> ·
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {ALL_PLATFORMS.map(({ key, label, Icon }) => {
            const enabled = has(key);
            return (
              <span
                key={key}
                title={enabled ? `${label} enabled` : `${label} not enabled for this team`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] ${
                  enabled
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-muted/40 border-dashed border-border/60 text-muted-foreground/70"
                }`}
              >
                <Icon className="h-3 w-3" />
                {!enabled && <Lock className="h-2.5 w-2.5 opacity-70" />}
              </span>
            );
          })}
        </div>
        {showManage && isOwner && (
          <Link
            href={teamSettingsHref}
            className="ml-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0"
          >
            <Settings className="h-3 w-3" /> Manage
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border bg-card/60 backdrop-blur p-3 sm:p-4 ${
        enabledCount === 0 ? "border-amber-200 bg-amber-50/60" : "border-border/60"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </span>
            <span className="text-sm font-semibold text-foreground truncate">{team.name}</span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                enabledCount === 0
                  ? "bg-amber-100 text-amber-800"
                  : enabledCount < totalCount
                    ? "bg-blue-50 text-blue-700"
                    : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {enabledCount}/{totalCount} platforms enabled
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {enabledCount === 0
              ? isOwner
                ? "No platforms enabled yet. Members can't publish until you grant at least one."
                : "Your team owner hasn't enabled any platforms yet — ask them to grant access."
              : isOwner
                ? "Members of this team can publish to the platforms shown in green below."
                : "You can publish to the platforms shown in green below."}
          </p>
        </div>
        {showManage && isOwner && (
          <Link
            href={teamSettingsHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/40 text-xs font-medium shrink-0 self-start sm:self-center"
          >
            <Settings className="h-3.5 w-3.5" /> Manage access
          </Link>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ALL_PLATFORMS.map(({ key, label, Icon }) => {
          const enabled = has(key);
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] ${
                enabled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-muted/40 border-dashed border-border/60 text-muted-foreground/80"
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="capitalize">{label}</span>
              {!enabled && <Lock className="h-3 w-3 opacity-60" />}
            </span>
          );
        })}
      </div>
    </div>
  );
}
