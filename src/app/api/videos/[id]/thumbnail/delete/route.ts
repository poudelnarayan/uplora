export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
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

    if (video.thumbnailKey) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.thumbnailKey }));
      } catch {}
    }

    // Remove thumbnail from post_media
    await supabaseAdmin
      .from('post_media')
      .delete()
      .eq('post_id', id)
      .eq('media_type', 'thumbnail');

    // Also clear from metadata
    const meta = { ...video.metadata };
    delete meta.thumbnail_key;
    await supabaseAdmin
      .from('posts')
      .update({ metadata: meta, updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting thumbnail:", e);
    return NextResponse.json({ error: "Failed to delete thumbnail" }, { status: 500 });
  }
}
