export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Vercel hobby = 10s, pro = 60s. Our fast path returns in <1s, but the
// background notify path may extend the function — give it room on pro.
export const maxDuration = 30;

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

type FailureBody = { ok: false; step: string; error: string; detail?: any };

function fail(step: string, error: string, status: number, detail?: any) {
  console.error(`[request-approval] FAIL @ ${step}:`, error, detail || "");
  return NextResponse.json<FailureBody>(
    { ok: false, step, error, detail },
    { status }
  );
}

export async function POST(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  let step = "init";
  const startedAt = Date.now();
  try {
    step = "params";
    const { id } = context.params;
    if (!id) return fail(step, "Missing video id", 400);

    step = "auth";
    const { userId } = await auth();
    if (!userId) return fail(step, "Auth required", 401);

    step = "clerk-user";
    let clerkUser: any = null;
    try {
      const client = await clerkClient();
      clerkUser = await client.users.getUser(userId);
    } catch (e: any) {
      return fail(step, "Failed to load Clerk user", 502, { message: e?.message });
    }

    step = "sync-user";
    let me: any = null;
    try {
      me = await syncUser(userId, clerkUser);
    } catch (e: any) {
      return fail(step, "Failed to sync user with Supabase", 500, { message: e?.message });
    }
    if (!me?.id) return fail(step, "User sync returned no id", 500);

    step = "get-video";
    let video: any = null;
    try {
      video = await getVideoById(id);
    } catch (e: any) {
      return fail(step, "Failed to load video", 500, { message: e?.message });
    }
    if (!video) return fail(step, "Video not found", 404, { id });

    step = "team-required";
    if (!video.teamId) {
      return fail(step, "Personal videos don't require approval", 400);
    }

    step = "team-and-role";
    let team: any = null;
    let role: string | null = null;
    try {
      const r = await getTeamAndRole(video.teamId, me.id);
      team = r.team;
      role = r.role;
    } catch (e: any) {
      return fail(step, "Failed to resolve team/role", 500, { message: e?.message });
    }
    if (!team) return fail(step, "Team not found", 404, { teamId: video.teamId });
    if (!role) {
      return fail(step, "You're not an active member of this team", 403, {
        teamId: video.teamId,
        userId: me.id,
      });
    }

    step = "role-check";
    if (role === "OWNER") {
      return fail(step, "Owners don't need approval. You can publish directly.", 400, { role });
    }
    if (role === "ADMIN") {
      return fail(step, "Admins don't need approval. You can publish directly.", 400, { role });
    }
    if (role !== "MANAGER" && role !== "EDITOR") {
      return fail(step, "Only managers/editors can request approval", 403, { role });
    }

    step = "status-check";
    if (video.status !== VideoStatus.READY_TO_PUBLISH) {
      return fail(
        step,
        "Mark this video as ready to publish before requesting approval.",
        400,
        { currentStatus: video.status, dbStatus: video.dbStatus }
      );
    }

    step = "db-update";
    let updated: any = null;
    try {
      updated = await updateVideoStatus(id, VideoStatus.APPROVAL_REQUESTED, {
        requested_by_user_id: me.id,
        approved_by_user_id: null,
      });
    } catch (e: any) {
      return fail(step, "Failed to update video status in DB", 500, { message: e?.message });
    }
    if (!updated) return fail(step, "DB update returned no row", 500);

    step = "broadcast";
    try {
      broadcast({
        type: "video.status",
        teamId: video.teamId,
        payload: { id, status: VideoStatus.APPROVAL_REQUESTED, requestedByUserId: me.id, approvedByUserId: null },
      });
      broadcast({
        type: "post.status",
        teamId: video.teamId,
        payload: { id, status: VideoStatus.APPROVAL_REQUESTED, contentType: "video" },
      });
    } catch (e: any) {
      // Broadcasts are best-effort; do not fail the request.
      console.warn("[request-approval] broadcast failed (non-fatal):", e?.message);
    }

    step = "schedule-notify";
    // Fire-and-forget. A hung SMTP server cannot block the response anymore.
    void notifyApprovers(team, video, id, me).catch((err) => {
      console.error("[request-approval] notify failed (non-fatal):", err);
    });

    const ms = Date.now() - startedAt;
    console.log(`[request-approval] OK in ${ms}ms id=${id} requester=${me.id}`);

    return NextResponse.json({
      ok: true,
      status: VideoStatus.APPROVAL_REQUESTED,
      video: updated,
      tookMs: ms,
    });
  } catch (e: any) {
    return fail(step, e?.message || "Unexpected error", 500, { stack: e?.stack });
  }
}

async function notifyApprovers(team: any, video: any, id: string, me: any) {
  try {
    const { data: ownerRow } = await supabaseAdmin
      .from("users")
      .select("id, email, name")
      .eq("id", team.owner_id)
      .single();

    const { data: adminRows } = await supabaseAdmin
      .from("team_members")
      .select(`role, status, users (id, name, email)`)
      .eq("team_id", team.id)
      .eq("status", "ACTIVE")
      .eq("role", "ADMIN");

    const recipients = new Map<string, { email: string; name?: string }>();
    if (ownerRow?.email) recipients.set(ownerRow.email, { email: ownerRow.email, name: ownerRow.name || undefined });
    for (const r of adminRows || []) {
      const u = (r as any).users;
      if (u?.email) recipients.set(String(u.email), { email: String(u.email), name: u.name || undefined });
    }

    const videoTitle = video.filename?.replace(/\.[^/.]+$/, "") || video.description || "Video";
    const videoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/videos/${id}`;
    const subject = `📝 Approval Request: ${videoTitle}`;
    const html = `<div><h2>📝 Video Approval Request</h2>
      <p><strong>Requester:</strong> ${me.name || me.email}</p>
      <p><strong>Video:</strong> ${videoTitle}</p>
      <p><strong>Team:</strong> ${team.name}</p>
      <p><a href="${videoUrl}">Review video</a></p></div>`;
    const text = `Approval Request\nRequester: ${me.name || me.email}\nVideo: ${videoTitle}\nTeam: ${team.name}\n${videoUrl}`;

    const sends: Promise<unknown>[] = [];
    for (const r of Array.from(recipients.values())) {
      sends.push(
        withTimeout(sendMail({ to: r.email, subject, html, text }), 10_000).catch((err) =>
          console.error("[request-approval] email send failed:", r.email, err?.message || err)
        )
      );
    }

    sends.push(
      (async () => {
        try {
          const sc = await getUserSocialConnections(String(team.owner_id));
          const chatId = sc.telegram?.chatId;
          if (chatId) {
            await withTimeout(
              sendTelegramMessageToChat(
                chatId,
                `📝 Approval Request\nTeam: ${team.name}\nRequester: ${me.name || me.email}\nVideo: ${videoTitle}\n${videoUrl}`
              ),
              10_000
            );
          }
        } catch (err: any) {
          console.error("[request-approval] telegram send failed:", err?.message || err);
        }
      })()
    );

    await Promise.allSettled(sends);
  } catch (e: any) {
    console.error("[request-approval] notifyApprovers outer error:", e?.message || e);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
