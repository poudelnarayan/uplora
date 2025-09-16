import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin, upsertSupabaseUser } from "./supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "./api-utils";

// Get authenticated user from Clerk and sync with Supabase
export async function getAuthenticatedUser() {
  try {
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
  } catch (error) {
    // Handle cases where auth() might fail due to context issues
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

// Updated getAuthenticatedUser using safe wrappers
export async function getAuthenticatedUserSafe() {
  const { userId } = await safeAuth();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const clerkUser = await safeCurrentUser();
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

// Check if user has access to a team (camelCase columns)
export async function checkTeamAccess(teamId: string, userId: string) {
  // Check if user is team owner
  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('ownerId', userId)
    .maybeSingle();

  if (teamError && teamError.code !== 'PGRST116') {
    throw teamError;
  }

  if (team) {
    return { hasAccess: true, role: 'OWNER' as const };
  }

  // Check if user is team member
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('teamId', teamId)
    .eq('userId', userId)
    .maybeSingle();

  if (memberError && memberError.code !== 'PGRST116') {
    throw memberError;
  }

  if (membership) {
    return { hasAccess: true, role: membership.role };
  }

  return { hasAccess: false, role: null };
}

// Create personal team for user if it doesn't exist (camelCase)
export async function ensurePersonalTeam(userId: string) {
  const { data: existingTeam, error: checkError } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('ownerId', userId)
    .eq('isPersonal', true)
    .maybeSingle();

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
      id: `personal-${userId}`,
      name: 'Personal',
      description: 'Your personal workspace',
      isPersonal: true,
      ownerId: userId,
      updatedAt: new Date().toISOString()
    })
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  return newTeam.id;
}

// Helper to format API responses (camelCase)
export function formatVideoResponse(video: any) {
  return {
    id: video.id,
    title: (video.filename || "").replace(/\.[^/.]+$/, ''),
    thumbnail: "",
    status: video.status || "PROCESSING",
    uploadedAt: video.uploadedAt,
    updatedAt: video.updatedAt,
    approvalRequestedAt: video.status === "PENDING" ? video.updatedAt : undefined,
    publishedAt: video.status === "PUBLISHED" ? video.updatedAt : undefined,
    duration: undefined,
    views: undefined,
    likes: undefined,
    s3Key: video.key,
    thumbnailKey: video.thumbnailKey,
    contentType: video.contentType,
    sizeBytes: video.sizeBytes,
    description: video.description,
    visibility: video.visibility,
    madeForKids: video.madeForKids,
    uploader: {
      id: video.userId,
      name: video.uploaderName,
      email: video.uploaderEmail,
      image: video.uploaderImage
    }
  };
}
