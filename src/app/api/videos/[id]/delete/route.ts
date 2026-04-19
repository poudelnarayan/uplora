export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { getVideoById, syncUser, getTeamAndRole } from "@/lib/video-utils";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const { id } = context.params;

    const client = await clerkClient();
    const user = await syncUser(userId, await client.users.getUser(userId));

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    let hasAccess = video.userId === user.id;
    if (!hasAccess && video.teamId) {
      const { role } = await getTeamAndRole(video.teamId, user.id);
      hasAccess = !!role;
    }

    if (!hasAccess) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // S3 cleanup
    try {
      const key = video.key;
      if (key) {
        const m = key.match(/^(teams\/[^/]+\/videos\/[^/]+)\//);
        const prefix = m?.[1] ? `${m[1]}/` : null;
        if (prefix) {
          let continuationToken: string | undefined;
          do {
            const listed = await s3.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET!, Prefix: prefix, ContinuationToken: continuationToken }));
            const objects = (listed.Contents || []).map(o => ({ Key: o.Key! }));
            if (objects.length > 0) await s3.send(new DeleteObjectsCommand({ Bucket: process.env.S3_BUCKET!, Delete: { Objects: objects } }));
            continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
          } while (continuationToken);
        } else {
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
        }
      }
      if (video.thumbnailKey) {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.thumbnailKey }));
      }
    } catch (s3Error) {
      console.error("S3 cleanup error:", s3Error);
    }

    // Delete post_media first (FK constraint)
    await supabaseAdmin.from('post_media').delete().eq('post_id', id);
    await supabaseAdmin.from('posts').delete().eq('id', id);

    broadcast({ type: "video.deleted", teamId: video.teamId || null, payload: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting video:", e);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
