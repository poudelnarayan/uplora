import { supabaseAdmin } from "@/lib/supabase";
import { ENABLED_PLATFORM_IDS, type PlatformId } from "@/config/platforms";

// Platform union + active list both come from the registry — flip a flag in
// src/config/platforms.ts to change what the product supports.
export type Platform = PlatformId;

export const ALL_PLATFORMS: Platform[] = ENABLED_PLATFORM_IDS;

export type TeamPlatformDecision =
  | { allowed: true; reason?: undefined }
  | {
      allowed: false;
      code: "TEAM_NOT_FOUND" | "PLATFORM_NOT_ENABLED";
      reason: string;
      teamName?: string;
      enabledPlatforms?: string[];
    };

/**
 * Authoritative server-side check: is this team allowed to publish to this platform?
 *
 * Rules:
 * - Personal teams (`is_personal=true`) always allowed — owner is publishing as themselves.
 * - Non-personal teams must list the platform in `enabled_platforms`.
 * - This is the SECURITY backbone for per-team platform gating; every publish
 *   route (YT, IG, FB, X, LI, Pinterest, Threads, TikTok, Telegram) must call it
 *   before kicking off any external API work.
 */
export async function checkTeamCanPublish(
  teamId: string | null | undefined,
  platform: Platform
): Promise<TeamPlatformDecision> {
  if (!teamId) {
    // No team context (e.g. ad-hoc personal upload) — caller decides.
    // Most publish flows DO have a team (personal team falls back here too).
    return { allowed: true };
  }

  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, name, is_personal, enabled_platforms")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) {
    return {
      allowed: false,
      code: "TEAM_NOT_FOUND",
      reason: "Team not found.",
    };
  }

  if (team.is_personal) return { allowed: true };

  const enabled = Array.isArray(team.enabled_platforms) ? team.enabled_platforms : [];
  if (enabled.includes(platform)) return { allowed: true };

  return {
    allowed: false,
    code: "PLATFORM_NOT_ENABLED",
    reason: `Your team owner hasn't enabled ${platform} for "${team.name}". Ask them to enable it from team settings.`,
    teamName: team.name,
    enabledPlatforms: enabled,
  };
}

/**
 * Throws a descriptive Error if the team is not allowed to publish to the platform.
 * Use in server routes inside try/catch for clean error responses.
 */
export async function assertTeamCanPublish(
  teamId: string | null | undefined,
  platform: Platform
): Promise<void> {
  const decision = await checkTeamCanPublish(teamId, platform);
  if (!decision.allowed) {
    const err = new Error(decision.reason) as Error & {
      code?: string;
      teamName?: string;
      enabledPlatforms?: string[];
      httpStatus?: number;
    };
    err.code = decision.code;
    err.teamName = decision.teamName;
    err.enabledPlatforms = decision.enabledPlatforms;
    err.httpStatus = 403;
    throw err;
  }
}

/**
 * Cascade: when an owner disconnects a platform from their account, strip that
 * platform from every non-personal team's allowlist they own. Privacy/safety:
 * if the underlying credential is gone, no team should keep "permission" to use it.
 *
 * Returns the number of teams updated.
 */
export async function cascadeRemovePlatformFromTeams(
  ownerInternalId: string,
  platform: Platform
): Promise<number> {
  // Pull all non-personal teams owned by this user that currently include the platform.
  const { data: teams, error } = await supabaseAdmin
    .from("teams")
    .select("id, enabled_platforms")
    .eq("owner_id", ownerInternalId)
    .eq("is_personal", false)
    .contains("enabled_platforms", [platform]);

  if (error || !teams || teams.length === 0) return 0;

  const now = new Date().toISOString();
  let updated = 0;
  for (const t of teams) {
    const next = (t.enabled_platforms || []).filter((p: string) => p !== platform);
    const { error: upErr } = await supabaseAdmin
      .from("teams")
      .update({ enabled_platforms: next, updated_at: now })
      .eq("id", t.id);
    if (!upErr) updated++;
  }
  return updated;
}
