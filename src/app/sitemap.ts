import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

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
    const videos = await prisma.video.findMany({
      where: { status: "PUBLISHED", OR: [{ visibility: null }, { visibility: "public" }] },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    });
    videoRoutes = videos.map((v) => ({ url: `${siteUrl}/videos/${v.id}`, lastModified: v.updatedAt }));
  } catch {
    // ignore db issues for sitemap
  }

  return [...staticRoutes, ...videoRoutes];
}


