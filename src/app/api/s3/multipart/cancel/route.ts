export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key, uploadId } = await req.json();
    if (!key || !uploadId) {
      return NextResponse.json({ error: "key and uploadId required" }, { status: 400 });
    }

    // Verify the lock belongs to the user (best-effort)
    const { data: lock } = await supabaseAdmin
      .from('uploadLocks')
      .select('*')
      .eq('userId', userId)
      .eq('key', key)
      .maybeSingle();

    // Attempt abort regardless; S3 will no-op if already completed/invalid
    try {
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        UploadId: uploadId,
      }));
    } catch (e) {
      // swallow abort errors to make cancel idempotent
    }

    // Cleanup lock if exists
    if (lock) {
      try {
        await supabaseAdmin
          .from('uploadLocks')
          .delete()
          .eq('userId', userId)
          .eq('key', key);
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
