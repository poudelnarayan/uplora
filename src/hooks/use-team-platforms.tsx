"use client";

import { useMemo } from "react";
import { useTeam } from "@/context/TeamContext";

export type Platform =
  | "youtube"
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "pinterest"
  | "threads"
  | "tiktok"
  | "telegram";

/**
 * Returns the publishing capabilities of a given team (defaults to the currently
 * selected team) for use in editor-side UIs.
 *
 * - Personal workspaces: every platform allowed (we never lock the owner out of
 *   their own account).
 * - Team workspaces: respects `team.enabledPlatforms` (owner-managed allowlist).
 *
 * NOTE: this is a UX helper. The authoritative check lives server-side in
 * `assertTeamCanPublish` — never trust this alone for security decisions.
 */
export function useTeamPlatforms(teamId?: string | null) {
  const { teams, personalTeam, selectedTeamId } = useTeam();
  const targetId = teamId ?? selectedTeamId;

  return useMemo(() => {
    const all = personalTeam ? [personalTeam, ...teams] : teams;
    const team = all.find((t) => t.id === targetId) || null;
    const isPersonal = !!team?.isPersonal;
    const enabled = isPersonal
      ? ALL_PLATFORMS
      : ((team as any)?.enabledPlatforms as string[] | undefined) || [];

    const has = (p: Platform) => enabled.includes(p);

    return {
      team,
      teamId: team?.id ?? null,
      isPersonal,
      enabledPlatforms: enabled,
      has,
      // Convenience flags for the most common gates in the UI
      canYouTube: has("youtube"),
      canInstagram: has("instagram"),
      canFacebook: has("facebook"),
      canTwitter: has("twitter"),
      canLinkedIn: has("linkedin"),
      canPinterest: has("pinterest"),
      canThreads: has("threads"),
      canTikTok: has("tiktok"),
      canTelegram: has("telegram"),
    };
  }, [teams, personalTeam, targetId]);
}

const ALL_PLATFORMS: Platform[] = [
  "youtube",
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "pinterest",
  "threads",
  "tiktok",
  "telegram",
];
