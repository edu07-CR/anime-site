import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Substitua pelo seu domínio quando comprar (ex: 'https://aniverse.com.br')
  // Enquanto isso, usamos a URL da Vercel como base.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-site-2dhx.vercel.app';

  // Lista de páginas estáticas principais
  const rotas = [
    '',
    '/destaques',
    '/top10',
    '/chat',
    '/login',
    '/privacidade',
    '/termos',
  ];

  return rotas.map((rota) => ({
    url: `${baseUrl}${rota}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: rota === '' ? 1.0 : 0.8,
  }));
}