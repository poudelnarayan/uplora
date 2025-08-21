import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { broadcast } from "@/lib/realtime";

// PATCH: update team (owner-only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    if (!name && !description) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.ownerId !== user.id) return NextResponse.json({ error: "Only the owner can update this team" }, { status: 403 });

    const updated = await prisma.team.update({
      where: { id: team.id },
      data: { ...(name ? { name } : {}), ...(description !== undefined ? { description } : {}) },
      select: { id: true, name: true, description: true, updatedAt: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// DELETE: delete team (owner-only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.ownerId !== user.id) return NextResponse.json({ error: "Only the owner can delete this team" }, { status: 403 });

    // Best-effort: delete all S3 objects under this team's prefix
    try {
      const bucket = process.env.S3_BUCKET;
      const region = process.env.AWS_REGION;
      if (bucket && region) {
        const s3 = new S3Client({ region });
        const prefix = `teams/${team.id}/`;
        let continuationToken: string | undefined = undefined;
        do {
          const listResp = await s3.send(
            new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken })
          );
          const keys = (listResp.Contents || [])
            .map((o) => o.Key)
            .filter((k): k is string => Boolean(k));
          if (keys.length > 0) {
            await s3.send(
              new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: keys.map((Key) => ({ Key })) },
              })
            );
          }
          continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
        } while (continuationToken);
      }
    } catch {}

    await prisma.team.delete({ where: { id: team.id } });
    // Broadcast deletion so clients refresh their team lists/dropdowns
    broadcast({ type: "team.deleted", payload: { id: team.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}


