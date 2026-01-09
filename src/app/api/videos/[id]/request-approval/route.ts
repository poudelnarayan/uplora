export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";
import { broadcast } from "@/lib/realtime";
import { sendTelegramMessageToChat } from "@/lib/notify";
import { normalizeSocialConnections } from "@/types/socialConnections";

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

    // Determine requester role in this team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, ownerId, name')
      .eq('id', video.teamId)
      .single();
    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId === me.id) {
      return NextResponse.json({ error: "Owners don't need approval. You can publish directly." }, { status: 400 });
    }

    const { data: membership } = await supabaseAdmin
      .from('team_members')
      .select('role,status')
      .eq('teamId', team.id)
      .eq('userId', me.id)
      .single();

    const role = (membership as any)?.role as string | undefined;
    const mStatus = (membership as any)?.status as string | undefined;
    if (mStatus !== "ACTIVE") {
      return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
    }
    if (role === "ADMIN") {
      return NextResponse.json({ error: "Admins don't need approval. You can publish directly." }, { status: 400 });
    }
    if (role !== "MANAGER" && role !== "EDITOR") {
      return NextResponse.json({ error: "Only managers/editors can request approval" }, { status: 403 });
    }

    // Enforce workflow: must be marked ready-to-publish (PENDING) before requesting approval
    const currentStatus = String(video.status || "PROCESSING").toUpperCase();
    if (currentStatus !== "PENDING") {
      return NextResponse.json({ error: "Mark this video as ready to publish before requesting approval." }, { status: 400 });
    }

    // Keep status as PENDING; requesting approval is tracked via requestedByUserId
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('video_posts')
      .update({ 
        requestedByUserId: me.id,
        approvedByUserId: null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', video.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating video:", updateError);
      return NextResponse.json({ error: "Failed to update video status" }, { status: 500 });
    }

    // Send notification to team owner + admins (email always; Telegram optional for owner if connected)
    try {
      const { data: ownerRow } = await supabaseAdmin
        .from('users')
        .select('email, name, socialConnections')
        .eq('id', team.ownerId)
        .single();

      const { data: adminRows } = await supabaseAdmin
        .from('team_members')
        .select(`
          role,
          status,
          users (
            id,
            name,
            email
          )
        `)
        .eq('teamId', team.id)
        .eq('status', 'ACTIVE')
        .eq('role', 'ADMIN');

      const recipients = new Map<string, { email: string; name?: string }>();
      if (ownerRow?.email) recipients.set(ownerRow.email, { email: ownerRow.email, name: ownerRow?.name || undefined });
      for (const r of adminRows || []) {
        const u = (r as any).users;
        if (u?.email) recipients.set(String(u.email), { email: String(u.email), name: u?.name || undefined });
      }

      const videoTitle = video.filename.replace(/\.[^/.]+$/, '');
      const videoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/videos/${video.id}`;

      const emailContent = {
        subject: `📝 Approval Request: ${videoTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>📝 Video Approval Request</h2>
            <p><strong>Requester:</strong> ${me.name || me.email}</p>
            <p><strong>Video:</strong> ${videoTitle}</p>
            <p><strong>Team:</strong> ${team.name}</p>
            <p><strong>Video URL:</strong> <a href="${videoUrl}">${videoUrl}</a></p>
            <p>Please review and approve this video for publication.</p>
          </div>
        `,
        text: [
          `Video Approval Request`,
          ``,
          `Requester: ${me.name || me.email}`,
          `Video: ${videoTitle}`,
          `Team: ${team.name}`,
          `Video URL: ${videoUrl}`,
          ``,
          `Please review and approve this video for publication.`,
        ].join("\n"),
      };

      for (const r of recipients.values()) {
        try {
          await sendMail({ to: r.email, subject: emailContent.subject, html: emailContent.html, text: emailContent.text });
        } catch (e) {
          console.error("Failed to send approval email to:", r.email, e);
        }
      }

      // Optional: Telegram message to owner (best-effort, per-user chat)
      try {
        const msg = [
          `📝 Approval Request`,
          `Team: ${team.name}`,
          `Requester: ${me.name || me.email}`,
          `Video: ${videoTitle}`,
          `Link: ${videoUrl}`,
        ].join("\n");
        const sc = normalizeSocialConnections((ownerRow as any)?.socialConnections);
        const ownerChatId = sc.telegram?.chatId;
        if (ownerChatId) await sendTelegramMessageToChat(ownerChatId, msg);
      } catch (e) {
        console.warn("Telegram notify failed:", e);
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't fail the request if email fails
    }

    // notify team
    broadcast({ type: "video.status", teamId: video.teamId || null, payload: { id: video.id, status: "PENDING" } });
    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed to request approval" }, { status: 500 });
  }
}
