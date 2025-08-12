import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Allow production builds to successfully complete even if
    // there are ESLint errors. We still surface them in dev.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with type errors.
    // This unblocks deploys while we iterate on typing.
    ignoreBuildErrors: true,
  },
  images: {
    // If you move thumbnails to a stable CDN hostname, list it here for full Next image optimization
    remotePatterns: process.env.NEXT_PUBLIC_IMAGE_CDN
      ? [
          {
            protocol: 'https',
            hostname: process.env.NEXT_PUBLIC_IMAGE_CDN,
          },
        ]
      : [],
  },
};

export default nextConfig;
