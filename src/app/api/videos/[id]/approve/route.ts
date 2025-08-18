import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { publishApprovedTemplate } from "@/lib/emailTemplates";
import { broadcast } from "@/lib/realtime";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    // Get video with team and user info
    const video = await prisma.video.findUnique({ 
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure current user is the team owner (if teamId set) or the video owner
    let isOwner = false;
    let team = null;
    if (video.teamId) {
      team = await prisma.team.findUnique({ where: { id: video.teamId } });
      if (team) {
        isOwner = team.ownerId === me.id;
      }
    } else {
      // Personal videos: only the uploader can approve (no approval workflow needed)
      isOwner = video.userId === me.id;
    }
    if (!isOwner) return NextResponse.json({ error: "Only owner can approve" }, { status: 403 });

    const updated = await prisma.video.update({
      where: { id: video.id },
      data: { status: "PUBLISHED", approvedByUserId: me.id },
    });
    broadcast({ type: "video.status", teamId: updated.teamId || null, payload: { id: updated.id, status: "PUBLISHED" } });

    // Send approval email to the video uploader if different from approver
    if (video.userId !== me.id && video.user.email) {
      try {
        const videoTitle = video.filename.replace(/\.[^/.]+$/, '');
        
        const emailTemplate = publishApprovedTemplate({
          editorName: video.user.name || video.user.email,
          videoTitle,
          teamName: team?.name || 'Your Team',
          ownerName: me.name || me.email
        });

        await sendEmail({
          to: video.user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });
      } catch (emailError) {
        console.error("Failed to send approval notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
