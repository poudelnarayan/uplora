export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

// Diagnostic endpoint — remove after debugging
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Resolve internal user
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id, clerk_id, personal_team_id")
    .eq("clerk_id", userId)
    .maybeSingle();

  // 2. All personal teams for this user (by clerk_id AND by internal id)
  const { data: teamsByClerk } = await supabaseAdmin
    .from("teams")
    .select("id, owner_id, is_personal, name")
    .eq("owner_id", userId)
    .eq("is_personal", true);

  const { data: teamsByInternal } = userRow?.id && userRow.id !== userId
    ? await supabaseAdmin
        .from("teams")
        .select("id, owner_id, is_personal, name")
        .eq("owner_id", userRow.id)
        .eq("is_personal", true)
    : { data: null };

  // 3. All social_accounts for any of those teams
  type TeamRow = { id: string; owner_id: string; is_personal: boolean; name: string };
  const allTeamIds = [
    ...((teamsByClerk as TeamRow[] | null)?.map((t) => t.id) ?? []),
    ...((teamsByInternal as TeamRow[] | null)?.map((t) => t.id) ?? []),
  ];

  const { data: socialRows } = allTeamIds.length
    ? await supabaseAdmin
        .from("social_accounts")
        .select("id, team_id, platform, external_account_id, display_name, revoked_at, created_at")
        .in("team_id", allTeamIds)
    : { data: [] };

  return NextResponse.json({
    clerkUserId: userId,
    userRow,
    teamsByClerkId: teamsByClerk,
    teamsByInternalId: teamsByInternal,
    socialAccounts: socialRows,
  });
}
