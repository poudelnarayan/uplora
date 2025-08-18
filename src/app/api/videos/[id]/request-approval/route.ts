import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { publishRequestTemplate } from "@/lib/emailTemplates";
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

    // Personal videos don't need approval workflow
    if (!video.teamId) {
      return NextResponse.json({ error: "Personal videos don't require approval" }, { status: 400 });
    }

    // Update status to PENDING
    const updated = await prisma.video.update({
      where: { id: video.id },
      data: { status: "PENDING", requestedByUserId: me.id },
    });

    // Send email notification to team owner if video belongs to a team
    if (video.teamId) {
      try {
        const team = await prisma.team.findUnique({
          where: { id: video.teamId },
          include: {
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });

        if (team?.owner) {
          const videoTitle = video.filename.replace(/\.[^/.]+$/, '');
          const videoUrl = `${process.env.NEXTAUTH_URL}/videos/${video.id}`;
          
          const emailTemplate = publishRequestTemplate({
            editorName: me.name || me.email,
            videoTitle,
            teamName: team.name,
            videoUrl,
            ownerName: team.owner.name || team.owner.email
          });

          await sendEmail({
            to: team.owner.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          });
        }
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    // notify team
    broadcast({ type: "video.status", teamId: video.teamId || null, payload: { id: video.id, status: "PENDING" } });
    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed to request approval" }, { status: 500 });
  }
}
