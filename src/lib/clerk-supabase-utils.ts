import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin, upsertSupabaseUser } from "./supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "./api-utils";

// Get authenticated user from Clerk and sync with Supabase
export async function getAuthenticatedUser() {
  try {
    const { userId } = await safeAuth();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("User not found");
    }

    const supabaseUser = await upsertSupabaseUser(userId, {
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      name: clerkUser.fullName || undefined,
      image: clerkUser.imageUrl || undefined,
    });

    return {
      clerkUserId: userId,
      clerkUser,
      supabaseUser,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('cookies')) {
      throw new Error("Authentication required");
    }
    throw error;
  }
}

// Safe wrapper for auth() that handles context issues
export async function safeAuth() {
  try {
    return await auth();
  } catch (error) {
    if (error instanceof Error && (error.message.includes('cookies') || error.message.includes('headers'))) {
      return { userId: null };
    }
    throw error;
  }
}

// Safe wrapper for currentUser() that handles context issues
export async function safeCurrentUser() {
  try {
    return await currentUser();
  } catch (error) {
    if (error instanceof Error && (error.message.includes('cookies') || error.message.includes('headers'))) {
      return null;
    }
    throw error;
  }
}

export async function getAuthenticatedUserSafe() {
  const { userId } = await safeAuth();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const clerkUser = await safeCurrentUser();
  if (!clerkUser) {
    throw new Error("User not found");
  }

  const supabaseUser = await upsertSupabaseUser(userId, {
    email: clerkUser.emailAddresses[0]?.emailAddress || "",
    name: clerkUser.fullName || undefined,
    image: clerkUser.imageUrl || undefined,
  });

  return {
    clerkUserId: userId,
    clerkUser,
    supabaseUser,
  };
}

// Wrapper for API routes that require authentication
export async function withAuth<T>(
  handler: (user: Awaited<ReturnType<typeof getAuthenticatedUser>>) => Promise<T>
) {
  try {
    const user = await getAuthenticatedUserSafe();
    return await handler(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required");
    }
    throw error;
  }
}

// Check if user has access to a team
export async function checkTeamAccess(teamId: string, userId: string) {
  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (teamError && teamError.code !== 'PGRST116') {
    throw teamError;
  }

  if (team) {
    return { hasAccess: true, role: 'OWNER' as const };
  }

  const { data: membership, error: memberError } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();

  if (memberError && memberError.code !== 'PGRST116') {
    throw memberError;
  }

  if (membership) {
    return { hasAccess: true, role: membership.role };
  }

  return { hasAccess: false, role: null };
}

// Create personal team for user if it doesn't exist
export async function ensurePersonalTeam(userId: string) {
  const { data: existingTeam, error: checkError } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('owner_id', userId)
    .eq('is_personal', true)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existingTeam) {
    // Sync personal_team_id on users table
    await supabaseAdmin
      .from('users')
      .update({ personal_team_id: existingTeam.id })
      .eq('id', userId)
      .is('personal_team_id', null);

    return existingTeam.id;
  }

  const now = new Date().toISOString();
  const { data: newTeam, error: createError } = await supabaseAdmin
    .from('teams')
    .insert({
      id: `personal-${userId}`,
      name: 'Personal',
      description: 'Your personal workspace',
      is_personal: true,
      owner_id: userId,
      updated_at: now,
      created_at: now,
    })
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  // Update user's personal_team_id
  await supabaseAdmin
    .from('users')
    .update({ personal_team_id: newTeam.id, updated_at: now })
    .eq('id', userId);

  return newTeam.id;
}

// Format a post row (with optional media) into the legacy video response shape
export function formatVideoResponse(post: any, media?: any) {
  const m = media || post.media?.[0] || {};
  return {
    id: post.id,
    title: post.content || m.filename || 'Video Post',
    thumbnail: "",
    status: post.status || "draft",
    uploadedAt: post.created_at,
    updatedAt: post.updated_at,
    approvalRequestedAt: post.status === "pending_approval" ? post.updated_at : undefined,
    publishedAt: post.status === "published" ? post.updated_at : undefined,
    duration: m.duration_ms ? m.duration_ms / 1000 : undefined,
    views: undefined,
    likes: undefined,
    s3Key: m.s3_key || post.metadata?.key,
    key: m.s3_key || post.metadata?.key,
    filename: m.filename || post.metadata?.filename,
    thumbnailKey: post.metadata?.thumbnail_key || null,
    contentType: m.content_type || post.metadata?.content_type,
    sizeBytes: m.size_bytes || post.metadata?.size_bytes,
    description: post.content,
    visibility: post.metadata?.visibility || null,
    madeForKids: post.metadata?.made_for_kids || false,
    youtubeVideoId: post.metadata?.youtube_video_id || null,
    youtubeThumbnailUploadStatus: post.metadata?.youtube_thumbnail_upload_status || null,
    uploader: {
      id: post.author_id,
      name: post.uploaderName,
      email: post.uploaderEmail,
      image: post.uploaderImage
    }
  };
}
