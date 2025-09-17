export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";
import { broadcast } from "@/lib/realtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: me, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Get video with team and user info
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videoPosts')
      .select(`
        *,
        users!videos_userId_fkey (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Authorization: allow team owner for team videos, and owner for personal videos
    let team: any = null;
    if (video.teamId) {
      const { data: t, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', video.teamId)
        .single();
      if (teamError || !t) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      team = t;
      if (team.ownerId !== me.id) {
        return NextResponse.json({ error: "Only team owner can approve videos" }, { status: 403 });
      }
    } else {
      // personal video: only the owner/uploader can publish
      if (video.userId !== me.id) {
        return NextResponse.json({ error: "Not allowed to publish this video" }, { status: 403 });
      }
    }

    // Parse YouTube metadata from request
    const { title, description, privacyStatus, madeForKids } = await req.json().catch(() => ({ }));

    // Ensure YouTube connection exists
    const { data: ytUser, error: ytUserError } = await supabaseAdmin
      .from('users')
      .select('youtubeAccessToken, youtubeRefreshToken')
      .eq('clerkId', userId)
      .single();

    if (ytUserError || !ytUser?.youtubeAccessToken) {
      return NextResponse.json(
        { error: "YouTube not connected. Please connect your YouTube account in settings." },
        { status: 403 }
      );
    }

    // Prepare YouTube client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.uplora.io'}/api/youtube/connect`
    );
    oauth2Client.setCredentials({ 
      access_token: ytUser.youtubeAccessToken,
      refresh_token: ytUser.youtubeRefreshToken 
    });
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Ensure we have a fresh access token before uploading
    try {
      // Newer libs refresh lazily; proactively refresh to avoid 401s when expiry_date is missing
      // @ts-ignore - method exists at runtime
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials?.access_token) {
        try {
          await supabaseAdmin
            .from('users')
            .update({
              youtubeAccessToken: credentials.access_token,
              youtubeExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
              updatedAt: new Date().toISOString(),
            })
            .eq('clerkId', userId);
        } catch {}
      }
    } catch {}

    // Get video stream from S3
    if (!video.key) {
      return NextResponse.json({ error: "Video storage key missing" }, { status: 400 });
    }
    const s3Obj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.key }));
    const mediaBody = s3Obj.Body as Readable;

    // Upload to YouTube with one retry on 401
    const performUpload = async () => {
      return youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: title || (video.filename ? video.filename.replace(/\.[^/.]+$/, '') : 'Untitled'),
            description: description || "",
          },
          status: {
            privacyStatus: privacyStatus || "private",
            madeForKids: madeForKids || false,
          },
        },
        media: { body: mediaBody },
      });
    };

    let insertRes;
    try {
      insertRes = await performUpload();
    } catch (err: any) {
      const status = err?.code || err?.status || err?.response?.status;
      if (status === 401) {
        try {
          // @ts-ignore - method exists at runtime
          const { credentials } = await oauth2Client.refreshAccessToken();
          if (credentials?.access_token) {
            try {
              await supabaseAdmin
                .from('users')
                .update({
                  youtubeAccessToken: credentials.access_token,
                  youtubeExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
                  updatedAt: new Date().toISOString(),
                })
                .eq('clerkId', userId);
            } catch {}
          }
        } catch {}
        // retry once
        insertRes = await performUpload();
      } else {
        throw err;
      }
    }

    const youtubeVideoId = insertRes.data.id || null;

    // If thumbnail exists, set it
    try {
      if (video.thumbnailKey && youtubeVideoId) {
        const thumbObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.thumbnailKey }));
        const thumbBody = thumbObj.Body as Readable;
        await youtube.thumbnails.set({ videoId: youtubeVideoId, media: { body: thumbBody } });
      }
    } catch (thumbErr) {
      console.warn('YouTube thumbnail set failed:', thumbErr);
    }

    // Update video status to PUBLISHED after successful upload
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('videoPosts')
      .update({ 
        status: "PUBLISHED", 
        approvedByUserId: me.id,
        updatedAt: new Date().toISOString()
      })
      .eq('id', video.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating video:", updateError);
      return NextResponse.json({ error: "Failed to approve video after upload" }, { status: 500 });
    }

    // Send email notification to the user who requested approval
    // Get the user who requested approval (team videos)
    const shouldNotifyRequester = !!video.teamId && !!video.requestedByUserId;
    let user: any = null;
    if (shouldNotifyRequester) {
      const { data: requester, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', video.requestedByUserId)
        .single();
      if (userFetchError || !requester) {
        console.error("User who requested approval not found:", userFetchError);
      } else {
        user = requester;
      }
    }

    if (user) {
      try {
        const videoTitle = video.filename.replace(/\.[^/.]+$/, '');
        const videoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/videos/${video.id}`;
        
        const emailContent = {
          subject: `✅ Video Approved: ${videoTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>✅ Video Approved!</h2>
              <p><strong>Video:</strong> ${videoTitle}</p>
              ${team ? `<p><strong>Team:</strong> ${team.name}</p>` : ''}
              <p><strong>Approved by:</strong> ${me.name || me.email}</p>
              <p><strong>Video URL:</strong> <a href="${videoUrl}">${videoUrl}</a></p>
              <p>Your video has been approved and is now published!</p>
            </div>
          `,
          text: `
            Video Approved!
            
            Video: ${videoTitle}
            ${team ? `Team: ${team.name}` : ''}
            Approved by: ${me.name || me.email}
            Video URL: ${videoUrl}
            
            Your video has been approved and is now published!
          `
        };

        await sendMail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });
      } catch (emailError) {
        console.error("Failed to send approval notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    // Broadcast approval event
    broadcast({ 
      type: "video.status", 
      teamId: video.teamId || null, 
      payload: { id: video.id, status: "PUBLISHED" }
    });

    return NextResponse.json({ ok: true, video: updated, youtubeVideoId });
  } catch (e) {
    console.error("Error approving video:", e);
    return NextResponse.json({ error: "Failed to approve video" }, { status: 500 });
  }
}
