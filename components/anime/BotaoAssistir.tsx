'use client';

import { Play, ExternalLink } from 'lucide-react';

export function BotaoAssistir() {
  const LINK_AFILIADO = 'https://www.crunchyroll.com/pt-br/';

  return (
    <a 
      href={LINK_AFILIADO}
      target="_blank"
      rel="noopener noreferrer"
      // Mudei o px-8 para px-5 (menos padding lateral) e py-3 para py-2 (mais fino)
      className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-5 py-2.5 rounded-lg transition-all shadow-md shadow-accent/20 text-sm"
      title="Assistir na Crunchyroll"
    >
      <Play size={18} fill="currentColor" />
      <span>Assistir na Crunchyroll</span>
      <ExternalLink size={14} className="opacity-70 ml-1" />
    </a>
  );
}