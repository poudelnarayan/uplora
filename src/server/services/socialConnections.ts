import { supabaseAdmin } from "@/lib/supabase";
import { normalizeSocialConnections, type SocialConnections } from "@/types/socialConnections";

/**
 * Central service for reading/writing `users.socialConnections`.
 *
 * Keep API routes thin: they should validate auth + inputs, then call this service.
 */

export async function getUserSocialConnections(userId: string): Promise<SocialConnections> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("socialConnections")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return normalizeSocialConnections(data?.socialConnections);
}

export async function updateUserSocialConnections(
  userId: string,
  updater: (current: SocialConnections) => SocialConnections
): Promise<SocialConnections> {
  const current = await getUserSocialConnections(userId);
  const next = updater(current);

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      socialConnections: next,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
  return next;
}

export async function clearFacebookInstagramConnections(userId: string) {
  return updateUserSocialConnections(userId, current => ({
    ...current,
    facebook: null,
    instagram: null,
  }));
}


