export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { checkTeamAccess } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function getOwnerForKey(key: string) {
  // Check post_media for the s3_key, then join to posts for team/author
  const { data, error } = await supabaseAdmin
    .from("post_media")
    .select("post_id, posts!inner(team_id, author_id)")
    .eq("s3_key", key)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  if (data) {
    const post = (data as any).posts;
    return { teamId: post?.team_id ?? null, userId: post?.author_id ?? null };
  }
  return null;
}

async function assertAuthorizedForKey(key: string) {
  const { userId } = await auth();
  if (!userId) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  const user = await currentUser();
  const role = (user?.publicMetadata as any)?.role as string | undefined;
  if (role && ["admin", "editor"].includes(role)) {
    return;
  }

  const teamMatch = key.match(/^teams\/([^/]+)\//);
  if (teamMatch?.[1]) {
    const access = await checkTeamAccess(teamMatch[1], userId);
    if (!access.hasAccess) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    return;
  }

  const owner = await getOwnerForKey(key);
  if (!owner) {
    throw Object.assign(new Error("Not found"), { status: 404 });
  }

  if (owner.teamId) {
    const access = await checkTeamAccess(owner.teamId, userId);
    if (!access.hasAccess) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    return;
  }

  if (owner.userId !== userId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const expiresIn = url.searchParams.get("expiresIn");
    const contentType = url.searchParams.get("contentType");
    // `redirect=1` returns a 302 to the signed URL so the route can be used
    // directly as an <img src> / <video src>. Without it (the historical
    // behavior) we return JSON, which the existing fetch()-based callers
    // depend on.
    const redirect = url.searchParams.get("redirect") === "1";

    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    await assertAuthorizedForKey(key);

    const isThumb = /\/(thumb|thumbnail)\//.test(key);
    const isPreview = /\/preview\//.test(key);
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      // Enhanced cache headers - longer cache for thumbnails
      ResponseCacheControl: isThumb ? "max-age=86400" : isPreview ? "max-age=3600" : "max-age=3600",
      ResponseContentDisposition: "inline",
      ResponseContentType: typeof contentType === "string" && contentType.length > 0 ? contentType : undefined,
    });

    // Longer expiry for thumbnails (24h vs 1h for videos)
    const maxExpiry = isThumb ? 86400 : 3600;
    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: Math.min(Number(expiresIn || 300), maxExpiry),
    });

    if (redirect) {
      // 302 so the browser fetches the signed URL directly. Cache header lets
      // the browser reuse the redirect without re-hitting our route during
      // grids of many thumbnails.
      return NextResponse.redirect(signedUrl, {
        status: 302,
        headers: { "Cache-Control": isThumb ? "private, max-age=300" : "private, max-age=60" },
      });
    }
    return NextResponse.json({ url: signedUrl });
  } catch (e: any) {
    const msg = e?.message || "Unauthorized";
    const status = e?.status || (msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500);
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, expiresIn, contentType } = await req.json();
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    await assertAuthorizedForKey(key);

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      // These headers help with streaming
      ResponseCacheControl: "max-age=3600",
      ResponseContentDisposition: "inline",
      ResponseContentType: typeof contentType === "string" && contentType.length > 0 ? contentType : undefined,
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: Math.min(Number(expiresIn || 300), 3600),
    });
    return NextResponse.json({ url });
  } catch (e: any) {
    const msg = e?.message || "Unauthorized";
    const status = e?.status || (msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500);
    return NextResponse.json({ error: msg }, { status });
  }
}

