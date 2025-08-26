import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildInviteUrl, generateInviteToken } from "@/lib/invitations";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (process.env.TEST_API_KEY && apiKey !== process.env.TEST_API_KEY) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, ownerId } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    console.log("🧪 Testing complete invitation flow");

    // Step 1: Get user's first team
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('ownerId', ownerId || 'owner-missing')
      .eq('isPersonal', false)
      .limit(1);

    if (teamsError || !teams || teams.length === 0) {
      return NextResponse.json({ error: "No teams found" }, { status: 404 });
    }

    const team = teams[0];
    console.log("✅ Using team:", team.name);

    // Step 2: Create invitation record
    const testToken = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .insert({
        id: `test-flow-invite-${Date.now()}`,
        email: email.toLowerCase(),
        role: 'EDITOR',
        token: testToken,
        expiresAt: expiresAt,
        teamId: team.id,
        inviterId: userId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error("❌ Error creating invitation:", inviteError);
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
    }

    console.log("✅ Invitation created with token:", testToken);

    // Step 3: Test fetching the invitation (simulating the invite page)
    const { data: fetchedInvitation, error: fetchError } = await supabaseAdmin
      .from('team_invites')
      .select(`
        *,
        teams (
          name,
          description
        ),
        users (
          name,
          email
        )
      `)
      .eq('token', testToken)
      .eq('status', 'PENDING')
      .gt('expiresAt', new Date().toISOString())
      .single();

    if (fetchError || !fetchedInvitation) {
      console.error("❌ Error fetching invitation:", fetchError);
      
      // Clean up
      await supabaseAdmin
        .from('team_invites')
        .delete()
        .eq('id', invitation.id);
      
      return NextResponse.json({ 
        error: "Failed to fetch invitation", 
        details: fetchError 
      }, { status: 500 });
    }

    console.log("✅ Invitation fetched successfully");

    // Step 4: Clean up test invitation
    await supabaseAdmin
      .from('team_invites')
      .delete()
      .eq('id', invitation.id);

    console.log("🧹 Test invitation cleaned up");

    const inviteUrl = buildInviteUrl(testToken);

    return NextResponse.json({
      success: true,
      message: "Complete invitation flow test successful",
      details: {
        teamName: team.name,
        inviteUrl,
        token: testToken,
        invitation: {
          id: fetchedInvitation.id,
          email: fetchedInvitation.email,
          role: fetchedInvitation.role,
          team: fetchedInvitation.teams,
          inviter: fetchedInvitation.users,
          expiresAt: fetchedInvitation.expiresAt
        }
      }
    });

  } catch (error) {
    console.error("❌ Invitation flow test failed:", error);
    
    return NextResponse.json({
      success: false,
      error: "Invitation flow test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
