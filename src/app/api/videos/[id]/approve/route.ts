import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { publishApprovedTemplate } from "@/lib/emailTemplates";
import { broadcast } from "@/lib/realtime";
import { google } from "googleapis";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    // Get request body for YouTube upload metadata (optional)
    const bodyData = await req.json().catch(() => ({}));
    const { title, description, privacyStatus, madeForKids } = bodyData;

    // Get video with team and user info
    const video = await prisma.video.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const me = await prisma.user.findUnique({ where: { id: userId } });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure current user is the team owner (if teamId set) or the video owner
    let isOwner = false;
    let team = null;
    if (video.teamId) {
      team = await prisma.team.findUnique({ where: { id: video.teamId } });
      if (team) {
        isOwner = team.ownerId === me.id;
      }
    } else {
      // Personal videos: only the uploader can approve (no approval workflow needed)
      isOwner = video.userId === me.id;
    }
    if (!isOwner) return NextResponse.json({ error: "Only owner can approve" }, { status: 403 });

    // Upload to YouTube first
    let youtubeVideoId = null;
    try {
      // Get user's YouTube credentials
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { youtubeAccessToken: true, youtubeRefreshToken: true }
      });

      if (!user?.youtubeAccessToken) {
        return NextResponse.json({ error: "YouTube not connected. Please connect your YouTube account in settings." }, { status: 400 });
      }

      // Create YouTube client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: user.youtubeAccessToken,
        refresh_token: user.youtubeRefreshToken,
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      // Get video file from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: video.key,
      });

      const s3Response = await s3.send(getObjectCommand);
      const body = s3Response.Body as Readable;

      // Prepare video metadata - use provided metadata or fall back to database values
      const videoTitle = title || video.filename.replace(/\.[^/.]+$/, '');
      const videoDescription = description || video.description || '';
      const videoPrivacyStatus = privacyStatus || video.visibility || 'private';
      const videoMadeForKids = typeof madeForKids === 'boolean' ? madeForKids : (video.madeForKids || false);

      // Upload to YouTube
      const insertRes = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: videoTitle,
            description: videoDescription,
            tags: ['Uplora'],
            categoryId: '22', // People & Blogs
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en',
          },
          status: {
            privacyStatus: videoPrivacyStatus,
            selfDeclaredMadeForKids: videoMadeForKids,
          },
        },
        media: { body },
      });

      youtubeVideoId = insertRes.data.id;

      // If thumbnail provided, set it
      if (video.thumbnailKey && youtubeVideoId) {
        try {
          const thumbObj = await s3.send(new GetObjectCommand({ 
            Bucket: process.env.S3_BUCKET!, 
            Key: video.thumbnailKey 
          }));
          const thumbBody = thumbObj.Body as Readable;
          await youtube.thumbnails.set({ 
            videoId: youtubeVideoId, 
            media: { body: thumbBody } 
          });
        } catch (e) {
          // Ignore thumbnail errors but continue
          console.warn("Failed to set thumbnail:", e);
        }
      }

    } catch (youtubeError) {
      console.error("YouTube upload failed:", youtubeError);
      return NextResponse.json({ 
        error: "Failed to upload to YouTube. Please check your YouTube connection and try again." 
      }, { status: 500 });
    }

    // Update video status to PUBLISHED and metadata if provided
    const updateData: any = { 
      status: "PUBLISHED", 
      approvedByUserId: me.id 
    };

    // Only update metadata if it was provided in the request
    if (title) updateData.filename = title;
    if (description) updateData.description = description;
    if (privacyStatus) updateData.visibility = privacyStatus;
    if (typeof madeForKids === 'boolean') updateData.madeForKids = madeForKids;

    const updated = await prisma.video.update({
      where: { id: video.id },
      data: updateData,
    });

    // Broadcast status change
    broadcast({ 
      type: "video.status", 
      teamId: updated.teamId || null, 
      payload: { id: updated.id, status: "PUBLISHED" } 
    });

    // Send approval email to the video uploader if different from approver
    if (video.userId !== me.id && video.user.email) {
      try {
        const videoTitle = title || video.filename.replace(/\.[^/.]+$/, '');
        
        const emailTemplate = publishApprovedTemplate({
          editorName: video.user.name || video.user.email,
          videoTitle,
          teamName: team?.name || 'Your Team',
          ownerName: me.name || me.email
        });

        await sendEmail({
          to: video.user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });
      } catch (emailError) {
        console.error("Failed to send approval notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      ok: true, 
      video: updated, 
      youtubeVideoId 
    });
  } catch (e) {
    console.error("Approve error:", e);
    return NextResponse.json({ error: "Failed to approve and publish" }, { status: 500 });
  }
}
