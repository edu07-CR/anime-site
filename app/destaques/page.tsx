'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Calendar, Star, Loader2, Sparkles } from 'lucide-react';

export default function DestaquesPage() {
  // O estado agora espera as 3 novas categorias
  const [data, setData] = useState<{ doDia: any[], daSemana: any[], daTemporada: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDestaques = async () => {
      try {
        const res = await fetch('/api/destaques');
        if (!res.ok) throw new Error('Erro na API');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDestaques();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  // Função auxiliar para não repetir o código do grid 3 vezes
  const renderAnimeGrid = (animes: any[], showEpBadge = false) => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {animes?.map((anime) => (
        <Link key={anime.id} href={`/anime/${anime.id}`} className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-border hover:border-accent transition-all">
          <div className="relative aspect-[2/3] w-full">
            <Image src={anime.coverUrl} alt={anime.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-110 transition-transform duration-300" />
            
            <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <Star size={12} fill="currentColor" /> {anime.score}
            </div>

            {showEpBadge && (
              <div className="absolute bottom-2 left-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-md">
                EP {anime.episodes}
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">{anime.title}</h3>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="w-full py-8">
      <h1 className="text-3xl font-bold text-text mb-8 flex items-center gap-3">
        <Sparkles className="text-accent" /> Explorar Destaques
      </h1>

      {/* SEÇÃO: DO DIA (Trending) */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="text-red-500" size={24} />
          <h2 className="text-2xl font-bold text-text">Em Alta Agora (Destaques do Dia)</h2>
        </div>
        {renderAnimeGrid(data?.doDia || [])}
      </section>

      {/* SEÇÃO: DA SEMANA (Em exibição, mais populares) */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-500" size={24} />
          <h2 className="text-2xl font-bold text-text">Lançamentos da Semana (Mais Populares)</h2>
        </div>
        {renderAnimeGrid(data?.daSemana || [], true)}
      </section>

      {/* SEÇÃO: DA TEMPORADA */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-accent" size={24} />
          <h2 className="text-2xl font-bold text-text">Destaques da Temporada</h2>
        </div>
        {renderAnimeGrid(data?.daTemporada || [])}
      </section>
    </div>
  );
}