'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock } from 'lucide-react';

export interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: number;
  episodes: number;
  formattedTime: string;
  source: string;
}

const BLUR_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export function CardAnime({ anime }: { anime: AnimeData }) {
  // Formata a nota (ex: 85 vira 8.5)
  const formattedScore = anime.score > 0 ? (anime.score > 10 ? (anime.score / 10).toFixed(1) : anime.score.toFixed(1)) : null;

  return (
    <Link 
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
        />
        
        {/* Nota */}
        {formattedScore && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 border border-white/10 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <Star size={10} fill="currentColor" /> {formattedScore}
          </div>
        )}

        {/* Tag do Episódio */}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          EP {anime.episodes}
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">
          {anime.title}
        </h3>
        
        {/* Horário */}
        <div className="flex items-center gap-1 text-text/70 text-xs mt-1 truncate">
          <Clock size={12} />
          {anime.formattedTime}
        </div>
      </div>
    </Link>
  );
}