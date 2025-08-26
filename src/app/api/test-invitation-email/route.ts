import { NextRequest, NextResponse } from "next/server";
import { sendInvitationEmail } from "@/app/api/teams/[teamId]/invite/route";
import { buildInviteUrl } from "@/lib/invitations";

export async function POST(req: NextRequest) {
  try {
    const { email, teamId, role = "EDITOR" } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    console.log("🔍 INVITATION EMAIL DEBUG:");
    console.log("Email:", email);
    console.log("Team ID:", teamId);
    console.log("Role:", role);
    console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);

    // Generate a test token
    const testToken = `test-token-${Date.now()}`;
    console.log("Test token:", testToken);

    // Call the actual invitation email function
    console.log("📧 Calling sendInvitationEmail...");
    await sendInvitationEmail(testToken, email, teamId, role);

    console.log("✅ Invitation email function completed");

    return NextResponse.json({
      success: true,
      message: "Test invitation email sent",
      testToken,
      inviteUrl: buildInviteUrl(testToken),
    });

  } catch (error) {
    console.error("❌ Test invitation email failed:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to send test invitation email",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test invitation email endpoint",
    usage: "POST with { email, teamId, role }",
    environment: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "❌ Not set",
    }
  });
}
