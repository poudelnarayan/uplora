export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { filename, contentType, sizeBytes } = await req.json();
    if (!filename || !contentType || !sizeBytes) {
      return NextResponse.json({ error: "filename, contentType, sizeBytes required" }, { status: 400 });
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from("video_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (videoError || !video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Permissions: personal -> owner; team -> owner/admin/manager
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

    const ext = filename.includes(".") ? filename.split(".").pop() : "mp4";
    const newKey = `uploads/${id}-${Date.now()}.${ext}`;
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: newKey,
      ContentType: contentType,
      ContentLength: sizeBytes,
      CacheControl: "max-age=31536000",
    });
    const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 900 });

    return NextResponse.json({ uploadUrl, key: newKey });
  } catch (e) {
    console.error("[replace/presign]", e);
    return NextResponse.json({ error: "Failed to presign" }, { status: 500 });
  }
}


