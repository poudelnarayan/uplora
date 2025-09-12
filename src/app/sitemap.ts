import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/videos",
  ].map((path) => ({ url: `${siteUrl}${path}`, lastModified: new Date() }));

  let videoRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: videos } = await supabaseAdmin
      .from('video_posts')
      .select('id, updatedAt, visibility, status')
      .eq('status', 'PUBLISHED')
      .order('updatedAt', { ascending: false })
      .limit(1000);

    if (videos && Array.isArray(videos)) {
      videoRoutes = videos
        .filter((v: any) => !v.visibility || v.visibility === 'public')
        .map((v: any) => ({ url: `${siteUrl}/videos/${v.id}`, lastModified: new Date(v.updatedAt) }));
    }
  } catch {
    // ignore db issues for sitemap
  }

  return [...staticRoutes, ...videoRoutes];
}


