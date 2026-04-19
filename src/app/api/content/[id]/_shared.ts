import { supabaseAdmin } from "@/lib/supabase";

export async function getTeamRoleForUser(teamId: string, userId: string) {
  const { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("id, owner_id")
    .eq("id", teamId)
    .single();

  if (teamError || !team) return { ok: false as const, status: 404, error: "Team not found" };

  if (team.owner_id === userId) return { ok: true as const, role: "OWNER" as const };

  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("role,status")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  const status = (membership as any)?.status;
  const role = (membership as any)?.role;
  if (status !== "ACTIVE" || !role) return { ok: false as const, status: 403, error: "Not a team member" };

  return { ok: true as const, role: role as "ADMIN" | "MANAGER" | "EDITOR" };
}
