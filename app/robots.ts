import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-site-2dhx.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',   // Bloqueia o painel de admin
        '/api/',     // Bloqueia as rotas de API
        '/perfil/',  // Bloqueia a página de perfil privada
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}