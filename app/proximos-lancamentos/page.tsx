'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Loader2, Star } from 'lucide-react';
import { EspacoAnuncio } from '@/components/layout/EspacoAnuncio';

interface AnimeProximo {
  id: number;
  title: string;
  coverUrl: string;
  score: number | null;
  releaseDate: string;
  format: string;
  genres: string[];
}

// Imagem base64 minúscula (1x1 pixel cinza) para servir de placeholder e evitar o CLS
const BLUR_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export default function ProximosLancamentosPage() {
  const [animes, setAnimes] = useState<AnimeProximo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const res = await fetch('/api/proximos-lancamentos');
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar');
        
        setAnimes(data.animes || []);
      } catch (error: any) {
        setErro(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnimes();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text flex items-center gap-3">
          <Calendar className="text-accent" size={32} />
          Próximos Lançamentos
        </h1>
        <p className="text-muted mt-2">
          Fique por dentro dos animes que estão chegando. Marque na sua agenda!
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-accent" size={48} />
        </div>
      ) : erro ? (
        <div className="text-center py-20 bg-surface border border-border rounded-xl">
          <p className="text-red-500 mb-4">{erro}</p>
          <button onClick={() => window.location.reload()} className="bg-accent text-white px-6 py-2 rounded-lg">
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {animes.map((anime, index) => (
            <Link 
              key={anime.id} 
              href={`/anime/${anime.id}`}
              className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-border hover:border-accent transition-all shadow-sm"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <Image 
                  src={anime.coverUrl} 
                  alt={anime.title} 
                  fill 
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300" 
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  priority={index < 5} // Otimiza as 5 primeiras imagens para carregar rápido
                />
                
                {/* Data de Lançamento */}
                <div className="absolute top-2 left-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                  <Calendar size={12} /> {anime.releaseDate}
                </div>

                {/* Nota (se tiver) */}
                {anime.score && (
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 border border-white/10 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> {anime.score.toFixed(1)}
                  </div>
                )}

                {/* Formato (TV, Movie) */}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {anime.format}
                </div>
              </div>
              
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">
                  {anime.title}
                </h3>
                <p className="text-xs text-muted mt-1 truncate">
                  {anime.genres.slice(0, 2).join(' • ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <EspacoAnuncio formato="banner" />
      </div>
    </div>
  );
}