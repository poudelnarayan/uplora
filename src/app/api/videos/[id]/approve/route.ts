export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";
import { broadcast } from "@/lib/realtime";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import { uploadYouTubeVideo, validateAndNormalizeMetadata } from "@/server/services/youtubeUploadService";

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
      .from('video_posts')
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

    // Authorization + workflow rules (team vs personal)
    let team: any = null;
    let callerRole: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER" | null = null;
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
      if (team.ownerId === me.id) {
        callerRole = "OWNER";
      } else {
        const { data: membership } = await supabaseAdmin
          .from("team_members")
          .select("role,status")
          .eq("teamId", team.id)
          .eq("userId", me.id)
          .single();
        const role = (membership as any)?.role as string | undefined;
        const mStatus = (membership as any)?.status as string | undefined;
        if (mStatus !== "ACTIVE") {
          return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
        }
        callerRole = (role as any) || "MEMBER";
      }

      // PENDING -> APPROVED (approve step) by owner/admin only; no publishing at this stage.
      if (String(video.status || "").toUpperCase() === "PENDING") {
        if (callerRole !== "OWNER" && callerRole !== "ADMIN") {
          return NextResponse.json({ error: "Only owner/admin can approve a pending video" }, { status: 403 });
        }
        const { data: approved, error: approveErr } = await supabaseAdmin
          .from('video_posts')
          .update({
            status: "APPROVED",
            approvedByUserId: me.id,
            requestedByUserId: null,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', video.id)
          .select()
          .single();
        if (approveErr) {
          return NextResponse.json({ error: "Failed to approve video" }, { status: 500 });
        }
        // Notify requester (best-effort)
        try {
          if (video.requestedByUserId) {
            const { data: requester } = await supabaseAdmin
              .from('users')
              .select('email,name')
              .eq('id', video.requestedByUserId)
              .single();
            if (requester?.email) {
              const videoTitle = String(video.filename || "").replace(/\.[^/.]+$/, '');
              const videoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/videos/${video.id}`;
              await sendMail({
                to: requester.email,
                subject: `✅ Approved: ${videoTitle}`,
                text: [
                  `Your video has been approved.`,
                  ``,
                  `Video: ${videoTitle}`,
                  `Link: ${videoUrl}`,
                  ``,
                  `Next step: an owner/admin can publish this video to YouTube.`,
                ].join("\n"),
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>✅ Video Approved</h2>
                    <p><strong>Video:</strong> ${videoTitle}</p>
                    <p><strong>Link:</strong> <a href="${videoUrl}">${videoUrl}</a></p>
                    <p>Next step: an owner/admin can publish this video to YouTube.</p>
                  </div>
                `,
              });
            }
          }
        } catch (e) {
          console.error("Failed to notify requester about approval:", e);
        }
        broadcast({
          type: "video.status",
          teamId: video.teamId || null,
          payload: { id: video.id, status: "APPROVED", requestedByUserId: null, approvedByUserId: me.id }
        });
        if (video.teamId) {
          broadcast({
            type: "post.status",
            teamId: String(video.teamId),
            payload: { id: video.id, status: "APPROVED", contentType: "video" }
          });
        }
        return NextResponse.json({ ok: true, status: "APPROVED", video: approved });
      }

      // Publishing permissions (team):
      // - Owner/Admin: can publish PENDING or APPROVED videos
      // - Editor/Manager: can only publish APPROVED videos (after admin approval)
      const upperStatus = String(video.status || "PROCESSING").toUpperCase();
      const isOwnerOrAdmin = callerRole === "OWNER" || callerRole === "ADMIN";
      const isEditorOrManager = callerRole === "EDITOR" || callerRole === "MANAGER";

      // For editors/managers: only allow if video is APPROVED
      if (isEditorOrManager && upperStatus !== "APPROVED") {
        return NextResponse.json({ 
          error: "This video needs to be approved by an owner/admin before you can publish it to YouTube." 
        }, { status: 403 });
      }

      // For non-team members, deny
      if (!isOwnerOrAdmin && !isEditorOrManager) {
        return NextResponse.json({ error: "Not allowed to publish this team video" }, { status: 403 });
      }

      // Readiness gate: block publish until PENDING (ready-to-publish) or APPROVED
      if (upperStatus !== "PENDING" && upperStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "This video is not ready to publish yet. Ask your editors to mark it 'Ready to publish' before publishing." },
          { status: 400 }
        );
      }
    } else {
      // personal video: only the owner/uploader can publish
      if (video.userId !== me.id) {
        return NextResponse.json({ error: "Not allowed to publish this video" }, { status: 403 });
      }
    }

    // Parse YouTube metadata from request
    const rawPayload = await req.json().catch(() => ({}));

    // Choose which YouTube account to publish with:
    // - Personal videos: current user
    // - Team videos: team owner (centralized team account)
    const publisherUserId = video.teamId ? String(team?.ownerId || "") : userId;
    if (!publisherUserId) {
      return NextResponse.json({ error: "Team owner missing for publishing" }, { status: 400 });
    }

    const safeTitle = rawPayload?.title || (video.filename ? video.filename.replace(/\.[^/.]+$/, '') : "Untitled");
    let metadata;
    try {
      metadata = validateAndNormalizeMetadata({
        title: safeTitle,
        description: rawPayload?.description || "",
        tags: rawPayload?.tags,
        categoryId: rawPayload?.categoryId,
        defaultLanguage: rawPayload?.defaultLanguage,
        defaultAudioLanguage: rawPayload?.defaultAudioLanguage,
        privacyStatus: rawPayload?.privacyStatus || "private",
        publishAt: rawPayload?.publishAt || null,
        madeForKids: rawPayload?.madeForKids,
        selfDeclaredMadeForKids: rawPayload?.selfDeclaredMadeForKids,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Invalid metadata" }, { status: 400 });
    }

    // Get video stream from S3
    if (!video.key) {
      return NextResponse.json({ error: "Video storage key missing" }, { status: 400 });
    }
    const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.key }));
    const sizeBytes = Number(head.ContentLength || 0);
    const mimeType = head.ContentType || video.contentType || "video/mp4";
    if (!sizeBytes) {
      return NextResponse.json({ error: "Video size missing. Upload aborted." }, { status: 400 });
    }

    const uploadSource = {
      sizeBytes,
      mimeType,
      createReadStream: async (startByte = 0) => {
        const range = startByte > 0 ? `bytes=${startByte}-` : undefined;
        const s3Obj = await s3.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: video.key,
          Range: range,
        }));
        return s3Obj.Body as Readable;
      },
    };

    await supabaseAdmin
      .from('video_posts')
      .update({
        youtubeUploadStatus: "UPLOADING",
        youtubeVisibility: metadata.privacyStatus,
        youtubePublishAt: metadata.publishAt,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', video.id);

    let uploadResult;
    try {
      uploadResult = await uploadYouTubeVideo(publisherUserId, uploadSource, metadata);
    } catch (err: any) {
      await supabaseAdmin
        .from('video_posts')
        .update({
          youtubeUploadStatus: "FAILED",
          youtubeVisibility: metadata.privacyStatus,
          youtubePublishAt: metadata.publishAt,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', video.id);
      return NextResponse.json({ error: err?.message || "YouTube upload failed" }, { status: 500 });
    }

    const newStatus =
      uploadResult.uploadStatus === "SCHEDULED"
        ? "SCHEDULED"
        : uploadResult.uploadStatus === "PUBLISHED"
          ? "PUBLISHED"
          : "PROCESSING";

    // Update video status after successful upload
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('video_posts')
      .update({
        status: newStatus,
        approvedByUserId: (video as any).approvedByUserId || me.id,
        requestedByUserId: null,
        youtubeVideoId: uploadResult.youtubeVideoId,
        youtubeUploadStatus: uploadResult.uploadStatus,
        youtubePublishAt: uploadResult.publishAt,
        youtubeVisibility: uploadResult.visibility,
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
          subject: `✅ Video Published: ${videoTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>✅ Video Published!</h2>
              <p><strong>Video:</strong> ${videoTitle}</p>
              ${team ? `<p><strong>Team:</strong> ${team.name}</p>` : ''}
              <p><strong>Published by:</strong> ${me.name || me.email}</p>
              <p><strong>Video URL:</strong> <a href="${videoUrl}">${videoUrl}</a></p>
              <p>Your video has been published to YouTube.</p>
            </div>
          `,
          text: `
            Video Published!
            
            Video: ${videoTitle}
            ${team ? `Team: ${team.name}` : ''}
            Published by: ${me.name || me.email}
            Video URL: ${videoUrl}
            
            Your video has been published to YouTube.
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
      payload: { id: video.id, status: newStatus, requestedByUserId: null, approvedByUserId: me.id } 
    });
    if (video.teamId) {
      broadcast({
        type: "post.status",
        teamId: String(video.teamId),
        payload: { id: video.id, status: newStatus, contentType: "video" }
      });
    }

    return NextResponse.json({ ok: true, video: updated, youtubeVideoId: uploadResult.youtubeVideoId });
  } catch (e) {
    console.error("Error approving video:", e);
    return NextResponse.json({ error: "Failed to approve video" }, { status: 500 });
  }
}
