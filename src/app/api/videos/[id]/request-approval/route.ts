export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";
import { broadcast } from "@/lib/realtime";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: me, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Get video with team and user info
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select(`
        *,
        users!videos_userId_fkey (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Personal videos don't need approval workflow
    if (!video.teamId) {
      return NextResponse.json({ error: "Personal videos don't require approval" }, { status: 400 });
    }

    // Update status to PENDING
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('video_posts')
      .update({ 
        status: "PENDING", 
        requestedByUserId: me.id,
        updatedAt: new Date().toISOString()
      })
      .eq('id', video.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating video:", updateError);
      return NextResponse.json({ error: "Failed to update video status" }, { status: 500 });
    }

    // Send email notification to team owner if video belongs to a team
    if (video.teamId) {
      try {
        const { data: team, error: teamError } = await supabaseAdmin
          .from('teams')
          .select(`
            *,
            users!teams_ownerId_fkey (
              name,
              email
            )
          `)
          .eq('id', video.teamId)
          .single();

        if (teamError || !team) {
          console.error("Team not found:", teamError);
        } else if (team.users) {
          const videoTitle = video.filename.replace(/\.[^/.]+$/, '');
          const videoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/videos/${video.id}`;
          
          const emailContent = {
            subject: `📝 Approval Request: ${videoTitle}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>📝 Video Approval Request</h2>
                <p><strong>Editor:</strong> ${me.name || me.email}</p>
                <p><strong>Video:</strong> ${videoTitle}</p>
                <p><strong>Team:</strong> ${team.name}</p>
                <p><strong>Video URL:</strong> <a href="${videoUrl}">${videoUrl}</a></p>
                <p>Please review and approve this video for publication.</p>
              </div>
            `,
            text: `
              Video Approval Request
              
              Editor: ${me.name || me.email}
              Video: ${videoTitle}
              Team: ${team.name}
              Video URL: ${videoUrl}
              
              Please review and approve this video for publication.
            `
          };

          await sendMail({
            to: team.users.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
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
