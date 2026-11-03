// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aumenta o limite de payload para as Server Actions (upload de imagens)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        port: '',
        pathname: '/**', // Permite qualquer caminho neste domínio
      },
      {
        protocol: 'https',
        hostname: 'esoqxnpanbskithahctm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // ... o restante do arquivo (headers, etc.)
};

export default nextConfig;