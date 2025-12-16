export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/placeholder/:width/:height
 *
 * Small SVG placeholder generator used by AvatarImage fallbacks.
 * This prevents noisy 404s in production.
 */
export async function GET(_req: NextRequest, ctx: { params: { width: string; height: string } }) {
  const w = Math.max(1, Math.min(2048, Number.parseInt(ctx.params.width, 10) || 32));
  const h = Math.max(1, Math.min(2048, Number.parseInt(ctx.params.height, 10) || 32));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#e5e7eb"/>
  <path d="M${w * 0.2} ${h * 0.75}c${w * 0.12}-${h * 0.22} ${w * 0.28}-${h * 0.33} ${w * 0.5}-${h * 0.33}s${w * 0.38} ${h * 0.11} ${w * 0.5} ${h * 0.33" fill="none" stroke="#9ca3af" stroke-width="${Math.max(1, Math.round(Math.min(w, h) * 0.06))}" stroke-linecap="round"/>
  <circle cx="${w * 0.5}" cy="${h * 0.38}" r="${Math.min(w, h) * 0.14}" fill="none" stroke="#9ca3af" stroke-width="${Math.max(1, Math.round(Math.min(w, h) * 0.06))}"/>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Cache for a while; the content is deterministic for width/height
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}


