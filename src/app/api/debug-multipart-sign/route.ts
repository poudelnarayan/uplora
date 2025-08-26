export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, uploadId, partNumber } = await request.json();

    // Test environment variables
    const envCheck = {
      S3_BUCKET: process.env.S3_BUCKET,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "SET" : "NOT_SET",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "NOT_SET"
    };

    // Test S3 client creation
    let s3ClientResult = null;
    try {
      const testS3 = new S3Client({ region: process.env.AWS_REGION });
      s3ClientResult = { success: true, region: process.env.AWS_REGION };
    } catch (error) {
      s3ClientResult = { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }

    // Test presigned URL generation
    let presignedUrlResult = null;
    if (key && uploadId && partNumber) {
      try {
        const url = await getSignedUrl(
          s3,
          new UploadPartCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: key,
            UploadId: uploadId,
            PartNumber: Number(partNumber),
          }),
          { expiresIn: 60 * 10 }
        );
        
        presignedUrlResult = {
          success: true,
          url: url.substring(0, 100) + "...", // Truncate for security
          urlLength: url.length
        };
      } catch (error) {
        presignedUrlResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      userId,
      requestData: { key, uploadId, partNumber },
      environment: envCheck,
      s3Client: s3ClientResult,
      presignedUrl: presignedUrlResult
    });

  } catch (error) {
    console.error("Debug multipart sign error:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
