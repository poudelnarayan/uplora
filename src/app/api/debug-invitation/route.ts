import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.log("🔍 Debug invitation email process started");
    console.log("📧 Target email:", email);
    console.log("👤 User ID:", userId);

    // Step 1: Get user's first team
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('ownerId', userId)
      .eq('isPersonal', false)
      .limit(1);

    if (teamsError) {
      console.error("❌ Error fetching teams:", teamsError);
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }

    if (!teams || teams.length === 0) {
      console.log("⚠️ No teams found for user");
      return NextResponse.json({ error: "No teams found. Create a team first." }, { status: 404 });
    }

    const team = teams[0];
    console.log("✅ Using team:", { id: team.id, name: team.name });

    // Step 2: Create a test invitation record
    const testToken = `debug-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log("🎫 Creating test invitation with token:", testToken);

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .insert({
        id: `debug-invite-${Date.now()}`,
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
      console.error("❌ Error creating test invitation:", inviteError);
      return NextResponse.json({ error: "Failed to create test invitation" }, { status: 500 });
    }

    console.log("✅ Test invitation created:", invitation.id);

    // Step 3: Send the invitation email using the exact same logic
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${testToken}`;
    
    console.log("🔗 Invite URL:", inviteUrl);
    console.log("🌐 NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);

    const subject = `You're invited to join ${team.name} on Uplora`;
    const text = [
      `You've been invited to join the team "${team.name}" on Uplora!`,
      "",
      `Role: EDITOR`,
      `Team: ${team.name}`,
      team.description ? `Description: ${team.description}` : "",
      "",
      `Click the link below to accept the invitation:`,
      inviteUrl,
      "",
      `This invitation expires in 7 days.`,
      "",
      `Best regards,`,
      `The Uplora Team`
    ].join("\n");

    const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:20px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">🎉 Team Invitation</h1>
          <p style="margin:8px 0 0;opacity:0.9;">Uplora</p>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
          <h2 style="margin:0 0 16px;color:#1f2937;">You're invited to join <strong>${team.name}</strong></h2>
          <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:16px;margin-bottom:20px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
              <div><strong>Team:</strong> ${team.name}</div>
              <div><strong>Role:</strong> EDITOR</div>
              ${team.description ? `<div><strong>Description:</strong> ${team.description}</div>` : ''}
            </div>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${inviteUrl}" style="background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:500;display:inline-block;">Accept Invitation</a>
          </div>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
            <p>This invitation expires in 7 days. If you have any questions, please contact your team administrator.</p>
          </div>
        </div>
      </div>
    </body></html>`;

    console.log("📧 About to send email...");
    console.log("📬 Subject:", subject);
    console.log("📝 Email length - Text:", text.length, "HTML:", html.length);

    // Step 4: Send the email
    const emailResult = await sendMail({
      to: email,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent successfully!", emailResult);

    // Step 5: Clean up test invitation
    await supabaseAdmin
      .from('team_invites')
      .delete()
      .eq('id', invitation.id);

    console.log("🧹 Test invitation cleaned up");

    return NextResponse.json({
      success: true,
      message: "Debug invitation email sent successfully",
      details: {
        teamName: team.name,
        inviteUrl,
        emailResult: {
          messageId: emailResult.messageId,
          accepted: emailResult.accepted,
          rejected: emailResult.rejected,
        }
      }
    });

  } catch (error) {
    console.error("❌ Debug invitation email failed:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to send debug invitation email",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
