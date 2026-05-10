/**
 * Display name for a team. Personal workspaces are normalized to
 * "Personal Space" regardless of what the DB stored — historic users
 * still have rows like "Narayan Poudel's Personal Workspace" and the UI
 * should render the cleaner label without a migration.
 */
export const PERSONAL_SPACE_LABEL = "Personal Space";

export function isPersonalTeamName(name?: string | null): boolean {
  if (!name) return false;
  return /personal\s*(workspace|space)/i.test(name);
}

export function getTeamDisplayName(
  team: { id?: string | null; name?: string | null } | null | undefined,
  personalTeamId?: string | null,
): string {
  if (!team) return PERSONAL_SPACE_LABEL;
  if (personalTeamId && team.id === personalTeamId) return PERSONAL_SPACE_LABEL;
  if (isPersonalTeamName(team.name)) return PERSONAL_SPACE_LABEL;
  return team.name || PERSONAL_SPACE_LABEL;
}
