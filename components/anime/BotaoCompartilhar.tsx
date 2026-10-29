'use client';

import { Share2 } from 'lucide-react';

export function BotaoCompartilhar({ titulo }: { titulo: string }) {
  const handleCompartilhar = async () => {
    const url = window.location.href;
    const shareData = {
      title: `AniVerse | ${titulo}`,
      text: `Olha esse anime no AniVerse: ${titulo}`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.log('Compartilhamento cancelado ou falhou', error);
    }
  };

  return (
    <button
      onClick={handleCompartilhar}
      className=" mt-0 mb-1 flex items-center justify-center gap-2 bg-surface border border-border text-text font-bold px-6 py-3 rounded-xl hover:border-accent hover:text-accent transition-all shadow-sm"
      title="Compartilhar este anime"
    >
      <Share2 size={20} />
      <span>Compartilhar</span>
    </button>
  );
}