'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, EyeOff, Eye } from 'lucide-react';
import Image from 'next/image';

interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
}

export function GerenciarStreaming() {
  const [animes, setAnimes] = useState<AnimeData[]>([]);
  const [inativos, setInativos] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const plataformas = [
    { id: 'crunchyroll', nome: 'Crunchyroll' },
    { id: 'prime', nome: 'Prime Video' },
    { id: 'disney', nome: 'Disney+' },
    { id: 'netflix', nome: 'Netflix' },
    { id: 'max', nome: 'HBO Max' },
  ];

  // Dias da semana para buscar os animes
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        let todosAnimes: AnimeData[] = [];

        // Busca os animes de cada dia da semana
        for (const dia of dias) {
          const res = await fetch(`/api/test-anilist?dia=${dia}`);
          if (res.ok) {
            const data = await res.json();
            if (data.animesDeHoje) {
              todosAnimes = [...todosAnimes, ...data.animesDeHoje];
            }
          }
        }

        // Remove duplicatas (animes que aparecem em mais de um dia)
        const animesUnicos = Array.from(
          new Map(todosAnimes.map((a) => [a.id, a])).values()
        );

        setAnimes(animesUnicos);
      } catch (error) {
        console.error('Erro ao buscar animes:', error);
      }
    };

    const fetchInativos = async () => {
      const { data } = await supabase.from('anime_streaming_inativos').select('*');
      if (data) {
        const map: Record<number, string[]> = {};
        data.forEach((item) => {
          if (!map[item.anime_id]) map[item.anime_id] = [];
          map[item.anime_id].push(item.plataforma);
        });
        setInativos(map);
      }
      setLoading(false);
    };

    fetchAnimes();
    fetchInativos();
  }, [supabase]);

  const toggleInativo = async (animeId: number, plataformaId: string) => {
    const isInativo = inativos[animeId]?.includes(plataformaId) || false;

    if (isInativo) {
      // Remove da lista de inativos (reativa)
      await supabase
        .from('anime_streaming_inativos')
        .delete()
        .eq('anime_id', animeId)
        .eq('plataforma', plataformaId);
      setInativos({
        ...inativos,
        [animeId]: inativos[animeId].filter((id) => id !== plataformaId),
      });
    } else {
      // Adiciona na lista de inativos
      await supabase
        .from('anime_streaming_inativos')
        .insert({ anime_id: animeId, plataforma: plataformaId });
      setInativos({
        ...inativos,
        [animeId]: [...(inativos[animeId] || []), plataformaId],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {animes.length === 0 ? (
        <p className="text-muted text-sm">Nenhum anime encontrado.</p>
      ) : (
        animes.map((anime) => (
          <div
            key={anime.id}
            className="flex flex-col md:flex-row md:items-center justify-between p-3 border border-border rounded-lg bg-bg/50 gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-14 rounded-md overflow-hidden flex-shrink-0">
                <Image src={anime.coverUrl} alt={anime.title} fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-text line-clamp-1">{anime.title}</p>
                <p className="text-xs text-muted">ID: {anime.id}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {plataformas.map((p) => {
                const isAtivo = !inativos[anime.id]?.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleInativo(anime.id, p.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${
                      isAtivo
                        ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                        : 'bg-red-500/10 text-red-500 border border-red-500/30 opacity-50'
                    }`}
                  >
                    {p.nome}
                    {isAtivo ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}