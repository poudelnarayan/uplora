export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";
import { broadcast } from "@/lib/realtime";
import { sendTelegramMessageToChat } from "@/lib/notify";
import { VideoStatus } from "@/types/videoStatus";
import { getVideoById, syncUser, getTeamAndRole, updateVideoStatus } from "@/lib/video-utils";
import { getUserSocialConnections } from "@/server/services/socialConnections";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const client = await clerkClient();
    const me = await syncUser(userId, await client.users.getUser(userId));

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    if (!video.teamId) {
      return NextResponse.json({ error: "Personal videos don't require approval" }, { status: 400 });
    }

    const { team, role } = await getTeamAndRole(video.teamId, me.id);
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (!role) return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });

    if (role === "OWNER") {
      return NextResponse.json({ error: "Owners don't need approval. You can publish directly." }, { status: 400 });
    }
    if (role === "ADMIN") {
      return NextResponse.json({ error: "Admins don't need approval. You can publish directly." }, { status: 400 });
    }
    if (role !== "MANAGER" && role !== "EDITOR") {
      return NextResponse.json({ error: "Only managers/editors can request approval" }, { status: 403 });
    }

    if (video.status !== VideoStatus.READY_TO_PUBLISH) {
      return NextResponse.json({ error: "Mark this video as ready to publish before requesting approval." }, { status: 400 });
    }

    const updated = await updateVideoStatus(id, VideoStatus.APPROVAL_REQUESTED, {
      requested_by_user_id: me.id,
      approved_by_user_id: null,
    });

    // Broadcast immediately so the owner's UI updates without waiting for slow IO.
    broadcast({
      type: "video.status",
      teamId: video.teamId,
      payload: { id, status: VideoStatus.APPROVAL_REQUESTED, requestedByUserId: me.id, approvedByUserId: null }
    });
    broadcast({
      type: "post.status",
      teamId: video.teamId,
      payload: { id, status: VideoStatus.APPROVAL_REQUESTED, contentType: "video" }
    });

    // Fire-and-forget notifications. Email sending was blocking the response by
    // ~30-40s per recipient when SMTP misbehaves (e.g. Fastmail account suspended);
    // the editor saw "Working…" forever and the DB write looked like a no-op.
    void notifyApprovers(team, video, id, me).catch((err) => {
      console.error("[request-approval] notify failed:", err);
    });

    return NextResponse.json({ ok: true, status: VideoStatus.APPROVAL_REQUESTED, video: updated });
  } catch (e) {
    console.error("[request-approval] error:", e);
    return NextResponse.json({ error: "Failed to request approval" }, { status: 500 });
  }
}

async function notifyApprovers(team: any, video: any, id: string, me: any) {
  const { data: ownerRow } = await supabaseAdmin
    .from('users')
    .select('id, email, name')
    .eq('id', team.owner_id)
    .single();

  const { data: adminRows } = await supabaseAdmin
    .from('team_members')
    .select(`role, status, users (id, name, email)`)
    .eq('team_id', team.id)
    .eq('status', 'ACTIVE')
    .eq('role', 'ADMIN');

  const recipients = new Map<string, { email: string; name?: string }>();
  if (ownerRow?.email) recipients.set(ownerRow.email, { email: ownerRow.email, name: ownerRow.name || undefined });
  for (const r of adminRows || []) {
    const u = (r as any).users;
    if (u?.email) recipients.set(String(u.email), { email: String(u.email), name: u.name || undefined });
  }

  const videoTitle = video.filename?.replace(/\.[^/.]+$/, '') || video.description || 'Video';
  const videoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/videos/${id}`;
  const subject = `📝 Approval Request: ${videoTitle}`;
  const html = `<div><h2>📝 Video Approval Request</h2>
    <p><strong>Requester:</strong> ${me.name || me.email}</p>
    <p><strong>Video:</strong> ${videoTitle}</p>
    <p><strong>Team:</strong> ${team.name}</p>
    <p><a href="${videoUrl}">Review video</a></p></div>`;
  const text = `Approval Request\nRequester: ${me.name || me.email}\nVideo: ${videoTitle}\nTeam: ${team.name}\n${videoUrl}`;

  // Run all email + telegram sends in PARALLEL with a hard 10s ceiling each, so a
  // hung SMTP can't ever stall the request again.
  const sends: Promise<unknown>[] = [];
  for (const r of Array.from(recipients.values())) {
    sends.push(
      withTimeout(sendMail({ to: r.email, subject, html, text }), 10_000)
        .catch((err) => console.error("[request-approval] email send failed:", r.email, err?.message || err))
    );
  }

  sends.push((async () => {
    try {
      const sc = await getUserSocialConnections(String(team.owner_id));
      const chatId = sc.telegram?.chatId;
      if (chatId) {
        await withTimeout(
          sendTelegramMessageToChat(chatId, `📝 Approval Request\nTeam: ${team.name}\nRequester: ${me.name || me.email}\nVideo: ${videoTitle}\n${videoUrl}`),
          10_000
        );
      }
    } catch (err: any) {
      console.error("[request-approval] telegram send failed:", err?.message || err);
    }
  })());

  await Promise.allSettled(sends);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
