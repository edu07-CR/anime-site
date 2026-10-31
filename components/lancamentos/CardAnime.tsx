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

export function CardAnime({ anime }: { anime: AnimeData }) {
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
          sizes="(max-width: 768px) 50vw, 20vw" 
          className="object-cover group-hover:scale-110 transition-transform duration-300" 
        />
        
        {anime.score > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <Star size={12} fill="currentColor" /> {anime.score}
          </div>
        )}

        <div className="absolute bottom-2 left-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
          EP {anime.episodes}
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        {/* TÍTULO DO ANIME (H3) - Organiza a hierarquia */}
        <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">
          {anime.title}
        </h3>
        
        <div className="flex items-center gap-1 text-text/70 text-xs mt-2">
          <Clock size={12} />
          {anime.formattedTime}
        </div>
      </div>
    </Link>
  );
}