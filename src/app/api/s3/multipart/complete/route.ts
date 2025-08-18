export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Client, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";
import { tmpdir } from "os";
import { join } from "path";
import { createWriteStream, createReadStream, unlinkSync } from "fs";
import { spawn } from "child_process";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, uploadId, parts, originalFilename, contentType, sizeBytes, teamId } = await req.json();

  if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
    return NextResponse.json({ error: "key, uploadId, parts required" }, { status: 400 });
  }

  try {
    const completed = await s3.send(new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .sort((a: any, b: any) => a.partNumber - b.partNumber)
          .map((p: any) => ({ PartNumber: Number(p.partNumber), ETag: p.etag })),
      },
    }));

    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: { email: session.user.email, name: session.user.name ?? "", image: session.user.image ?? "" },
    });

    // Get upload lock to retrieve metadata
    const uploadLock = await prisma.uploadLock.findFirst({
      where: { userId: user.id, key }
    });

    if (!uploadLock) {
      return NextResponse.json({ error: "Upload lock not found" }, { status: 404 });
    }

    // Parse metadata from upload lock
    const metadata = uploadLock.metadata ? JSON.parse(uploadLock.metadata) : {};
    const { filename: originalFilename, contentType, teamId: lockTeamId } = metadata;

    const title = String(originalFilename || "").replace(/\.[^/.]+$/, "") || "Untitled";

    // Derive teamId from key if not in metadata
    const m = key.match(/(?:teams\/(.*?)|users\/(.*?))\/videos\/(.*?)\//);
    const teamIdFromKey = m && m[1] ? m[1] : null;
    const finalTeamId = lockTeamId ?? teamId ?? teamIdFromKey;

    // Validate team access if teamId is provided
    if (finalTeamId) {
      // Check if user is the team owner
      const team = await prisma.team.findFirst({
        where: { id: finalTeamId, ownerId: user.id }
      });
      
      if (!team) {
        // If not owner, check if user is a team member
        const membership = await prisma.teamMember.findFirst({
          where: { teamId: finalTeamId, userId: user.id }
        });
        if (!membership) {
          return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
        }
      }
    }

    // Create the video record only after successful upload completion
    const video = await prisma.video.create({
      data: {
        key,
        filename: title,
        contentType: contentType || "application/octet-stream",
        sizeBytes: typeof sizeBytes === "number" ? sizeBytes : 0,
        teamId: finalTeamId,
        userId: user.id,
        status: "PROCESSING",
      },
    });

    // Broadcast video creation event
    broadcast({ 
      type: "video.created", 
      teamId: video.teamId || null, 
      payload: { id: video.id, title: video.filename }
    });

    // Clean up upload lock
    await prisma.uploadLock.deleteMany({
      where: { userId: user.id, key }
    });

    // Fire-and-forget background optimization for fast web preview
    setTimeout(async () => {
      try {
        const tempDir = tmpdir();
        const originalPath = join(tempDir, `original-${key.replace(/\W+/g, '-')}.mp4`);
        const optimizedPath = join(tempDir, `optimized-${key.replace(/\W+/g, '-')}.mp4`);

        // Download original
        const getObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
        const body = getObj.Body as NodeJS.ReadableStream;
        await new Promise((resolve, reject) => {
          const ws = createWriteStream(originalPath);
          body.pipe(ws);
          ws.on("finish", resolve);
          ws.on("error", reject);
        });

        // Transcode with faststart for progressive streaming
        await new Promise<void>((resolve, reject) => {
          const ff = spawn("ffmpeg", [
            "-y",
            "-i", originalPath,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-maxrate", "3500k",
            "-bufsize", "7000k",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            optimizedPath,
          ]);
          ff.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
          ff.on("error", reject);
        });

        // Upload optimized to a deterministic preview key
        const previewKey = (finalTeamId
          ? `teams/${finalTeamId}/videos/${video.id}/preview/web.mp4`
          : `users/${user.id}/videos/${video.id}/preview/web.mp4`);
        await s3.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: previewKey,
          Body: createReadStream(optimizedPath),
          ContentType: "video/mp4",
          CacheControl: "max-age=31536000",
        }));

        // Cleanup temp files
        try { unlinkSync(originalPath); unlinkSync(optimizedPath); } catch {}
      } catch (e) {
        // Silent fail; preview will fall back
        console.error("Preview optimization failed", e);
      }
    }, 0);

    return NextResponse.json({ ok: true, location: completed.Location ?? null, videoId: video.id });
  } catch (e) {
    try {
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        UploadId: uploadId,
      }));
    } catch {}
    // Release lock on error too
    try {
      const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (owner) await prisma.uploadLock.deleteMany({ where: { userId: owner.id, key } });
    } catch {}
    return NextResponse.json({ error: "Complete failed" }, { status: 500 });
  }
}