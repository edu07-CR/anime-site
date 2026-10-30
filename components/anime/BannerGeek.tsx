'use client';

import { ShoppingBag, ExternalLink } from 'lucide-react';

export function BannerGeek({ tituloAnime }: { tituloAnime: string }) {
  // Links de busca dinâmicos com o seu ID de afiliado
  // Substitua o ID da Shopee e da Amazon pelos seus reais
  const linkShopee = `https://shopee.com.br/search?keyword=${encodeURIComponent(tituloAnime)}`;
  const linkAmazon = `https://www.amazon.com.br/s?k=${encodeURIComponent(tituloAnime)}&tag=aniverseofici-20`;

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 w-full max-w-md my-6">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="text-accent" size={20} />
        <h3 className="text-sm font-bold text-text">Produtos de "{tituloAnime}"</h3>
      </div>
      
      <p className="text-xs text-muted mb-3">
        Encontre figures, mangás e colecionáveis deste anime.
      </p>

      <div className="flex flex-wrap gap-2">
        {/* BOTÃO SHOPEE */}
        <a
          href={linkShopee}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#EE4D2D] text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          Ver na Shopee
          <ExternalLink size={14} className="opacity-70" />
        </a>

        {/* BOTÃO AMAZON */}
        <a
          href={linkAmazon}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#FF9900] text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          Ver na Amazon
          <ExternalLink size={14} className="opacity-70" />
        </a>
      </div>
    </div>
  );
}