export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { broadcast } from "@/lib/realtime";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { key: newKey, filename } = await req.json();
    if (!newKey || !filename) return NextResponse.json({ error: "key and filename required" }, { status: 400 });

    const { data: video, error: videoError } = await supabaseAdmin
      .from("video_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (videoError || !video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Permissions
    if (!video.teamId) {
      if (video.userId !== userId) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    } else {
      const { data: team } = await supabaseAdmin.from("teams").select("ownerId").eq("id", video.teamId).single();
      if (team?.ownerId !== userId) {
        const { data: membership } = await supabaseAdmin
          .from("team_members")
          .select("role,status")
          .eq("teamId", video.teamId)
          .eq("userId", userId)
          .single();
        const role = String((membership as any)?.role || "");
        const status = String((membership as any)?.status || "");
        if (status !== "ACTIVE" || (role !== "MANAGER" && role !== "ADMIN")) {
          return NextResponse.json({ error: "Not allowed" }, { status: 403 });
        }
      }
    }

    const oldKey = video.key;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("video_posts")
      .update({
        key: newKey,
        filename,
        status: "PROCESSING",
        requestedByUserId: null,
        approvedByUserId: null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[replace/complete] update error:", updateError);
      return NextResponse.json({ error: "Failed to update video", details: updateError.message }, { status: 500 });
    }

    // Best-effort delete old object
    if (oldKey && oldKey !== newKey) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: oldKey }));
      } catch (e) {
        console.warn("Failed to delete old video key", oldKey, e);
      }
    }

    broadcast({
      type: "video.status",
      teamId: updated.teamId || null,
      payload: { id: updated.id, status: "PROCESSING", requestedByUserId: null, approvedByUserId: null }
    });
    if (updated.teamId) {
      broadcast({
        type: "post.status",
        teamId: String(updated.teamId),
        payload: { id: updated.id, status: "PROCESSING", contentType: "video" }
      });
    }
    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    console.error("[replace/complete] unexpected:", e);
    return NextResponse.json({ error: "Failed to finalize replace" }, { status: 500 });
  }
}


