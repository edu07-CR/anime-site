'use client';

import { PlayCircle, ExternalLink } from 'lucide-react';

interface Plataforma {
  nome: string;
  url: string;
  cor: string;
  textoCor: string;
}

export function OndeAssistir({ tituloAnime }: { tituloAnime: string }) {
  const criarUrl = (baseUrl: string) => {
    return `${baseUrl}${encodeURIComponent(tituloAnime)}`;
  };

  const plataformas: Plataforma[] = [
    { 
      nome: 'Crunchyroll', 
      url: criarUrl('https://www.crunchyroll.com/pt-br/search?q='), 
      cor: 'bg-[#F47521]', 
      textoCor: 'text-white' 
    },
    { 
      nome: 'Prime Video', 
      // LINK DE AFILIADO DA AMAZON
      url: 'https://link.amazon/B05KK7P0R', 
      cor: 'bg-[#00A8E1]', 
      textoCor: 'text-white' 
    },
    { 
      nome: 'Disney+', 
      // LINK DE AFILIADO DA DISNEY (ADMITAD)
      url: 'https://grfpr.com/g/z1w3b3celh62a5c9a7d55c1634180b/', 
      cor: 'bg-[#113CCF]', 
      textoCor: 'text-white' 
    },
    { 
      nome: 'Netflix', 
      url: criarUrl('https://www.netflix.com/search?q='), 
      cor: 'bg-[#E50914]', 
      textoCor: 'text-white' 
    },
    { 
      nome: 'HBO Max', 
      url: criarUrl('https://www.max.com/br/pt/search?q='), 
      cor: 'bg-[#5C2D91]', 
      textoCor: 'text-white' 
    },
  ];

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 w-full max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <PlayCircle className="text-accent" size={20} />
        <h3 className="text-sm font-bold text-text">Onde assistir "{tituloAnime}"?</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {plataformas.map((p) => (
          <a
            key={p.nome}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${p.cor} ${p.textoCor} text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
          >
            {p.nome}
            <ExternalLink size={14} className="opacity-70" />
          </a>
        ))}
      </div>
      
      <p className="text-xs text-muted mt-3">
        A disponibilidade pode variar. Clique para buscar no serviço.
      </p>
    </div>
  );
}