'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function OndeAssistir({ tituloAnime, animeId }: { tituloAnime: string; animeId: number }) {
  const [plataformasInativas, setPlataformasInativas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const criarUrl = (baseUrl: string) => `${baseUrl}${encodeURIComponent(tituloAnime)}`;

  // Cores mais escuras para garantir contraste
  const todasPlataformas = [
    { id: 'crunchyroll', nome: 'Crunchyroll', url: criarUrl('https://www.crunchyroll.com/pt-br/search?q='), cor: 'bg-[#E65100]' },
    { id: 'prime', nome: 'Prime Video', url: `https://www.primevideo.com/search?phrase=${encodeURIComponent(tituloAnime)}&tag=aniverseofici-20`, cor: 'bg-[#005A9E]' },
    { id: 'disney', nome: 'Disney+', url: 'https://grfpr.com/g/z1w3b3celh62a5c9a7d55c1634180b/', cor: 'bg-[#0D2A8A]' },
    { id: 'netflix', nome: 'Netflix', url: criarUrl('https://www.netflix.com/search?q='), cor: 'bg-[#B20710]' },
    { id: 'max', nome: 'HBO Max', url: criarUrl('https://www.max.com/br/pt/search?q='), cor: 'bg-[#3E1A6E]' },
  ];

  useEffect(() => {
    const fetchInativos = async () => {
      const { data } = await supabase
        .from('anime_streaming_inativos')
        .select('plataforma')
        .eq('anime_id', animeId);

      if (data) {
        setPlataformasInativas(data.map((d) => d.plataforma));
      }
      setLoading(false);
    };
    fetchInativos();
  }, [animeId, supabase]);

  if (loading) {
    return <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 w-full max-w-md flex justify-center"><Loader2 className="animate-spin text-accent" /></div>;
  }

  const plataformasParaMostrar = todasPlataformas.filter(p => !plataformasInativas.includes(p.id));

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 w-full max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <PlayCircle className="text-accent" size={20} />
        <h3 className="text-sm font-bold text-text">Onde assistir "{tituloAnime}"?</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {plataformasParaMostrar.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${p.cor} text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
          >
            {p.nome}
            <ExternalLink size={14} className="opacity-70" />
          </a>
        ))}
      </div>
      
      <p className="text-xs text-text/70 mt-3">
        A disponibilidade pode variar. Clique para buscar no serviço.
      </p>
    </div>
  );
}