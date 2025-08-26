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
      .from('videos')
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

    // Check if user is team owner
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', video.teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== me.id) {
      return NextResponse.json({ error: "Only team owner can approve videos" }, { status: 403 });
    }

    // Get the user who requested approval
    const { data: user, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', video.requestedByUserId)
      .single();

    if (userFetchError || !user) {
      console.error("User who requested approval not found:", userFetchError);
      // Continue anyway - we'll still approve the video
    }

    // Update video status to PUBLISHED
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('videos')
      .update({ 
        status: "PUBLISHED", 
        approvedByUserId: me.id,
        updatedAt: new Date().toISOString()
      })
      .eq('id', video.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating video:", updateError);
      return NextResponse.json({ error: "Failed to approve video" }, { status: 500 });
    }

    // Send email notification to the user who requested approval
    if (user) {
      try {
        const videoTitle = video.filename.replace(/\.[^/.]+$/, '');
        const videoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/videos/${video.id}`;
        
        const emailContent = {
          subject: `✅ Video Approved: ${videoTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>✅ Video Approved!</h2>
              <p><strong>Video:</strong> ${videoTitle}</p>
              <p><strong>Team:</strong> ${team.name}</p>
              <p><strong>Approved by:</strong> ${me.name || me.email}</p>
              <p><strong>Video URL:</strong> <a href="${videoUrl}">${videoUrl}</a></p>
              <p>Your video has been approved and is now published!</p>
            </div>
          `,
          text: `
            Video Approved!
            
            Video: ${videoTitle}
            Team: ${team.name}
            Approved by: ${me.name || me.email}
            Video URL: ${videoUrl}
            
            Your video has been approved and is now published!
          `
        };

        await sendMail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });
      } catch (emailError) {
        console.error("Failed to send approval notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    // Broadcast approval event
    broadcast({ 
      type: "video.status", 
      teamId: video.teamId || null, 
      payload: { id: video.id, status: "PUBLISHED" }
    });

    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    console.error("Error approving video:", e);
    return NextResponse.json({ error: "Failed to approve video" }, { status: 500 });
  }
}
