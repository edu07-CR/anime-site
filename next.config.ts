import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  images: {
    formats: ['image/avif', 'image/webp'], // <-- ADICIONADO: Conversão para formatos modernos
    minimumCacheTTL: 14400, // <-- ADICIONADO: Cache de 4 horas para as imagens
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'esoqxnpanbskithahctm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;