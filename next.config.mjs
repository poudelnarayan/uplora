/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
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