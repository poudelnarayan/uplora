"use client";

import { useMemo } from "react";
import { useTeam } from "@/context/TeamContext";
import {
  ENABLED_PLATFORM_IDS,
  type PlatformId,
} from "@/config/platforms";

export type Platform = PlatformId;

/**
 * Returns the publishing capabilities of a given team (defaults to the
 * currently selected team) for use in editor-side UIs.
 *
 * Platform availability = product-level registry (`src/config/platforms.ts`)
 * intersected with the team's owner-managed allowlist:
 * - Personal workspaces: every ENABLED platform allowed.
 * - Team workspaces: enabled ∩ `team.enabledPlatforms`.
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
    const allowlist = isPersonal
      ? ENABLED_PLATFORM_IDS
      : ((team as any)?.enabledPlatforms as string[] | undefined) || [];

    const enabled = ENABLED_PLATFORM_IDS.filter(
      (p) => isPersonal || allowlist.includes(p),
    );

    const has = (p: Platform) => enabled.includes(p);

    return {
      team,
      teamId: team?.id ?? null,
      isPersonal,
      enabledPlatforms: enabled,
      has,
      canYouTube: has("youtube"),
      // Disabled platforms — kept so existing call sites compile and gate
      // correctly. Re-enable via src/config/platforms.ts, not here.
      canInstagram: false,
      canFacebook: false,
      canTwitter: false,
      canLinkedIn: false,
      canPinterest: false,
      canThreads: false,
      canTikTok: false,
      canTelegram: false,
    };
  }, [teams, personalTeam, targetId]);
}
