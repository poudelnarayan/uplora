import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin, upsertSupabaseUser } from "./supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "./api-utils";

// Get authenticated user from Clerk and sync with Supabase
export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("User not found");
  }

  // Sync user data with Supabase
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
    const user = await getAuthenticatedUser();
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
  // Check if user is team owner
  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('ownerId', userId)
    .single();

  if (teamError && teamError.code !== 'PGRST116') {
    throw teamError;
  }

  if (team) {
    return { hasAccess: true, role: 'OWNER' as const };
  }

  // Check if user is team member
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .single();

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
    .eq('ownerId', userId)
    .eq('is_personal', true)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existingTeam) {
    return existingTeam.id;
  }

  // Create personal team
  const { data: newTeam, error: createError } = await supabaseAdmin
    .from('teams')
    .insert({
      name: 'Personal',
      description: 'Your personal workspace',
      is_personal: true,
      ownerId: userId,
    })
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  return newTeam.id;
}

// Helper to format API responses
export function formatVideoResponse(video: any) {
  return {
    id: video.id,
    title: (video.filename || "").replace(/\.[^/.]+$/, ''),
    thumbnail: "",
    status: video.status || "PROCESSING",
    uploadedAt: video.uploaded_at,
    updatedAt: video.updated_at,
    approvalRequestedAt: video.status === "PENDING" ? video.updated_at : undefined,
    publishedAt: video.status === "PUBLISHED" ? video.updated_at : undefined,
    duration: undefined,
    views: undefined,
    likes: undefined,
    s3Key: video.key,
    thumbnailKey: video.thumbnail_key,
    contentType: video.content_type,
    sizeBytes: video.size_bytes,
    description: video.description,
    visibility: video.visibility,
    madeForKids: video.made_for_kids,
    uploader: {
      id: video.user_id,
      name: video.uploader_name,
      email: video.uploader_email,
      image: video.uploader_image
    }
  };
}
