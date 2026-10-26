import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'esoqxnpanbskithahctm.supabase.co', // <-- Confira se este é o seu domínio exato
        port: '',
        pathname: '/storage/v1/object/public/**', // <-- Confira se tem a barra e o asterisco
      },
    ],
  },
};

export default nextConfig;