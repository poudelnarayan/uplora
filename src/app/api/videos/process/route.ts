export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import { spawn } from "child_process";
import { createWriteStream, createReadStream, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  try {
    // Get video record
    const video = await prisma.video.findFirst({
      where: { id: videoId, user: { email: session.user.email } }
    });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Skip if already processed
    if (video.status === "processing" || video.key.includes("-web-optimized")) {
      return NextResponse.json({ message: "Already processing or processed" });
    }

    // Mark as processing
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "processing" }
    });

    // Download original from S3
    const tempDir = tmpdir();
    const originalPath = join(tempDir, `original-${videoId}.mp4`);
    const optimizedPath = join(tempDir, `optimized-${videoId}.mp4`);

    const getCmd = new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.key });
    const response = await s3.send(getCmd);
    const stream = response.Body as NodeJS.ReadableStream;
    
    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(originalPath);
      stream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // FFmpeg processing for web optimization
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', originalPath,
      '-c:v', 'libx264',           // H.264 codec
      '-preset', 'fast',           // Fast encoding
      '-crf', '23',                // Good quality
      '-maxrate', '2M',            // Max bitrate 2Mbps
      '-bufsize', '4M',            // Buffer size
      '-c:a', 'aac',               // AAC audio
      '-b:a', '128k',              // Audio bitrate
      '-movflags', '+faststart',   // Move moov atom to start for streaming
      '-f', 'mp4',                 // MP4 format
      optimizedPath
    ]);

    await new Promise((resolve, reject) => {
      ffmpegProcess.on('close', (code) => {
        if (code === 0) resolve(null);
        else reject(new Error(`FFmpeg failed with code ${code}`));
      });
      ffmpegProcess.on('error', reject);
    });

    // Upload optimized version to S3
    const optimizedKey = `${video.key.replace(/^uploads\//, 'web-optimized/')}-web.mp4`;
    const optimizedStream = createReadStream(optimizedPath);
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: optimizedKey,
      Body: optimizedStream,
      ContentType: 'video/mp4',
      CacheControl: 'max-age=31536000', // 1 year cache
    }));

    // Update database with web-optimized key
    await prisma.video.update({
      where: { id: videoId },
      data: { 
        status: "PROCESSING",
        // Store both keys in a JSON field or add webOptimizedKey column
        // For now, we'll add a comment field to store the web key
      }
    });

    // Add web-optimized key to database (you might want to add a webOptimizedKey column)
    await prisma.$executeRaw`UPDATE videos SET filename = filename || ' [WEB:' || ${optimizedKey} || ']' WHERE id = ${videoId}`;

    // Cleanup temp files
    try {
      unlinkSync(originalPath);
      unlinkSync(optimizedPath);
    } catch {}

    return NextResponse.json({ 
      success: true, 
      originalKey: video.key,
      webOptimizedKey: optimizedKey 
    });

  } catch (error) {
    console.error("Video processing error:", error);
    
    // Reset status on error
    await prisma.video.updateMany({
      where: { id: videoId },
      data: { status: "PROCESSING" }
    });

    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
