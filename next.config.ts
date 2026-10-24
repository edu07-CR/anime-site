import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // <-- Adicione esta linha para esconder o logo do Next.js
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
    ],
  },
};

export default nextConfig;