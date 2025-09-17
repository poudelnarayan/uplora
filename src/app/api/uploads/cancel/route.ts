export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { S3Client, AbortMultipartUploadCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const result = await withAuth(async ({ supabaseUser }) => {
      const { key, uploadId, videoId } = await req.json();

      // Abort multipart upload if in progress
      if (key && uploadId) {
        try {
          await s3.send(new AbortMultipartUploadCommand({ 
            Bucket: process.env.S3_BUCKET!, 
            Key: key, 
            UploadId: uploadId 
          }));
        } catch (error) {
          console.error("Failed to abort multipart upload:", error);
        }
      }

      // Best-effort delete S3 object if it exists and was partially uploaded
      if (key && !uploadId) {
        try {
          await s3.send(new DeleteObjectCommand({ 
            Bucket: process.env.S3_BUCKET!, 
            Key: key 
          }));
        } catch (error) {
          console.error("Failed to delete S3 object:", error);
        }
      }

      // Remove provisional video row if present and still not associated with a full file
      if (videoId) {
        try {
          const { error: deleteError } = await supabaseAdmin
            .from('video_posts')
            .delete()
            .eq('id', videoId)
            .eq('userId', supabaseUser.id);

          if (deleteError) {
            console.error("Failed to delete video:", deleteError);
          }
        } catch (error) {
          console.error("Error deleting video:", error);
        }
      }

      // Release any upload lock for this user
      try {
        const { error: lockError } = await supabaseAdmin
          .from('uploadLocks')
          .delete()
          .eq('userId', supabaseUser.id);

        if (lockError) {
          console.error("Failed to delete upload lock:", lockError);
        }
      } catch (error) {
        console.error("Error deleting upload lock:", error);
      }

      return createSuccessResponse({ 
        message: "Upload cancelled successfully" 
      });
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload cancel error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to cancel upload"),
      { status: 500 }
    );
  }
}


