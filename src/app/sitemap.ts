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
  ].map((path) => ({ url: `${siteUrl}${path}`, lastModified: new Date() }));

  let videoRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: videos } = await supabaseAdmin
      .from('posts')
      .select('id, updated_at, metadata, status')
      .eq('post_type', 'video')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (videos && Array.isArray(videos)) {
      videoRoutes = videos
        .filter((v: any) => !v.metadata?.visibility || v.metadata.visibility === 'public')
        .map((v: any) => ({ url: `${siteUrl}/videos/${v.id}`, lastModified: new Date(v.updated_at) }));
    }
  } catch {
    // ignore db issues for sitemap
  }

  return [...staticRoutes, ...videoRoutes];
}
