export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { supabaseAdmin } from "@/lib/supabase";
import { checkTeamAccess } from "@/lib/clerk-supabase-utils";

const s3 = new S3Client({ region: process.env.AWS_REGION || "eu-north-1" });
const BUCKET = process.env.S3_BUCKET as string;

async function assertAuthorizedForKey(key: string) {
  const { userId } = await auth();
  if (!userId) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  const user = await currentUser();
  const role = (user?.publicMetadata as any)?.role as string | undefined;
  // If role is privileged, allow
  if (role && ["admin", "editor"].includes(role)) return { userId };

  // Otherwise ensure the user can access the video by team membership or ownership
  const { data: video } = await supabaseAdmin
    .from('video_posts')
    .select('id, teamId, userId')
    .eq('key', key)
    .maybeSingle();

  if (!video) throw Object.assign(new Error("Not found"), { status: 404 });

  if (video.teamId) {
    const access = await checkTeamAccess(video.teamId, userId);
    if (!access.hasAccess) throw Object.assign(new Error("Forbidden"), { status: 403 });
  } else if (video.userId !== userId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  return { userId };
}

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    await assertAuthorizedForKey(key);

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ResponseContentType: "video/mp4",
        ResponseContentDisposition: `inline; filename="${key.split('/').pop() || 'video.mp4'}"`
      }),
      { expiresIn: 60 * 5 }
    );

    return NextResponse.json({ url });
  } catch (e: any) {
    const msg = e?.message || "Unauthorized";
    const code = e?.status || (msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500);
    return NextResponse.json({ error: msg }, { status: code });
  }
}
