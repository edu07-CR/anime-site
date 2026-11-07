'use client';

import { Share2, Check } from 'lucide-react';
import { useState } from 'react';

export function BotaoCompartilhar({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);

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
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000); // Volta ao normal após 2 segundos
      }
    } catch (error) {
      console.log('Compartilhamento cancelado ou falhou', error);
    }
  };

  return (
    <button
      onClick={handleCompartilhar}
      className="mt-0 mb-1 flex items-center justify-center gap-2 bg-surface border border-border text-text font-bold px-6 py-3 rounded-xl hover:border-accent hover:text-accent transition-all shadow-sm w-full sm:w-auto"
      title="Compartilhar este anime"
    >
      {copiado ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
      <span>{copiado ? 'Link copiado!' : 'Compartilhar'}</span>
    </button>
  );
}