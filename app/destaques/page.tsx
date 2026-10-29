'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Star, Loader2, Sparkles, TrendingUp, PlayCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { EspacoAnuncio } from '@/components/layout/EspacoAnuncio'; // <-- IMPORT DO ANÚNCIO

export default function DestaquesPage() {
  const [data, setData] = useState<{ doDia: any[], daSemana: any[], daTemporada: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const carrosselDiaRef = useRef<HTMLDivElement>(null);
  const carrosselTemporadaRef = useRef<HTMLDivElement>(null);

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

  const scrollCarrossel = (ref: React.RefObject<HTMLDivElement | null>, direcao: 'esquerda' | 'direita') => {
    if (ref.current) {
      const scrollAmount = direcao === 'direita' ? 350 : -350;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  return (
    <div className="w-full pb-12">
      
      {/* ESPAÇO PARA ANÚNCIO NO TOPO */}
      <div className="mb-8">
        <EspacoAnuncio formato="banner" />
      </div>

      {/* 1. CARROSSEL DE DESTAQUES (EM ALTA) */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="text-red-500" size={24} />
            <h2 className="text-2xl font-bold text-text">Em Alta (Destaques do Dia)</h2>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => scrollCarrossel(carrosselDiaRef, 'esquerda')} className="p-2 rounded-full bg-surface border border-border hover:bg-bg hover:text-accent transition-colors cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scrollCarrossel(carrosselDiaRef, 'direita')} className="p-2 rounded-full bg-surface border border-border hover:bg-bg hover:text-accent transition-colors cursor-pointer">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div 
          ref={carrosselDiaRef}
          className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent"
        >
          {data?.doDia.map((anime, index) => (
            <Link 
              key={anime.id} 
              href={`/anime/${anime.id}`} 
              className="group flex-shrink-0 w-[160px] md:w-[200px] flex flex-col bg-surface rounded-xl overflow-hidden border border-border hover:border-accent transition-all snap-start"
            >
              <div className="relative aspect-[2/3] w-full">
                <Image src={anime.coverUrl} alt={anime.title} fill sizes="200px" className="object-cover group-hover:scale-110 transition-transform duration-300" />
                
                <div className="absolute top-2 left-2 bg-black/70 text-white font-bold px-2 py-1 rounded-md text-xs backdrop-blur-sm">
                  #{index + 1} em Alta
                </div>

                <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> {anime.score}
                </div>

                <div className="absolute bottom-2 left-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <PlayCircle size={12} /> EP {anime.episodes}
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">{anime.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. TOP 10 RANKING (LISTA VERTICAL EM 2 COLUNAS) */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-accent" size={24} />
          <h2 className="text-2xl font-bold text-text">Top 10 Lançamentos da Semana</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-flow-col md:grid-rows-5 gap-3">
          {data?.daSemana.slice(0, 10).map((anime, index) => (
            <Link 
              key={anime.id} 
              href={`/anime/${anime.id}`} 
              className="flex items-center gap-3 bg-surface border border-border p-2 md:p-3 rounded-xl hover:border-accent transition-colors group"
            >
              <div className="text-4xl md:text-5xl font-black text-border group-hover:text-accent/50 transition-colors w-10 text-center flex-shrink-0">
                {index + 1}
              </div>

              <div className="relative w-12 h-16 md:w-14 md:h-20 flex-shrink-0 rounded-md overflow-hidden">
                <Image src={anime.coverUrl} alt={anime.title} fill className="object-cover" />
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <h3 className="text-text font-bold text-sm line-clamp-2 group-hover:text-accent transition-colors mb-1">{anime.title}</h3>
                <p className="text-muted text-xs flex items-center gap-2">
                  <span className="text-yellow-500 font-bold"><Star size={12} className="inline mr-1" fill="currentColor"/>{anime.score}</span>
                  • EP {anime.episodes}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. DESTAQUES DA TEMPORADA */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent" size={24} />
            <h2 className="text-2xl font-bold text-text">Destaques da Temporada</h2>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => scrollCarrossel(carrosselTemporadaRef, 'esquerda')} className="p-2 rounded-full bg-surface border border-border hover:bg-bg hover:text-accent transition-colors cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scrollCarrossel(carrosselTemporadaRef, 'direita')} className="p-2 rounded-full bg-surface border border-border hover:bg-bg hover:text-accent transition-colors cursor-pointer">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div 
          ref={carrosselTemporadaRef}
          className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent"
        >
          {data?.daTemporada.map((anime) => (
            <Link key={anime.id} href={`/anime/${anime.id}`} className="group flex-shrink-0 w-[160px] md:w-[200px] flex flex-col bg-surface rounded-xl overflow-hidden border border-border hover:border-accent transition-all snap-start">
              <div className="relative aspect-[2/3] w-full">
                <Image src={anime.coverUrl} alt={anime.title} fill sizes="200px" className="object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> {anime.score}
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">{anime.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ESPAÇO PARA ANÚNCIO NO FINAL */}
      <div className="mt-10">
        <EspacoAnuncio formato="banner" />
      </div>

    </div>
  );
}