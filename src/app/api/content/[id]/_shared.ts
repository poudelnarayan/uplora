import { supabaseAdmin } from "@/lib/supabase";

export type ContentType = "text" | "image" | "reel";

export async function findContentRowById(id: string) {
  const tables: Array<{ name: string; type: ContentType }> = [
    { name: "text_posts", type: "text" },
    { name: "image_posts", type: "image" },
    { name: "reel_posts", type: "reel" },
  ];

  for (const t of tables) {
    const { data, error } = await supabaseAdmin.from(t.name).select("*").eq("id", id).maybeSingle();
    if (data) return { table: t.name, type: t.type, row: data };
    if (error && (error as any).code !== "PGRST116") {
      throw new Error((error as any).message || `Failed reading ${t.name}`);
    }
  }
  return null;
}

export async function getTeamRoleForUser(teamId: string, userId: string) {
  const { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("id, ownerId")
    .eq("id", teamId)
    .single();

  if (teamError || !team) return { ok: false as const, status: 404, error: "Team not found" };

  if (team.ownerId === userId) return { ok: true as const, role: "OWNER" as const };

  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("role,status")
    .eq("teamId", teamId)
    .eq("userId", userId)
    .single();

  const status = (membership as any)?.status;
  const role = (membership as any)?.role;
  if (status !== "ACTIVE" || !role) return { ok: false as const, status: 403, error: "Not a team member" };

  return { ok: true as const, role: role as "ADMIN" | "MANAGER" | "EDITOR" };
}


