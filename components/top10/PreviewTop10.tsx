'use client';

import { CarrosselImagens } from '@/components/feed/CarrosselImagens';
import { MessageSquareText } from 'lucide-react';

interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: string;
}

export function PreviewTop10({ animes, username }: { animes: AnimeData[], username: string }) {
  const imagensCarrossel = animes.map(anime => 
    anime.coverUrl.replace('/large/', '/extraLarge/')
  );

  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
      <div className="p-3 border-b border-border flex items-center gap-2 bg-bg/50">
        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
          {username.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-bold text-text">@{username}</span>
      </div>
      
      <CarrosselImagens imagens={imagensCarrossel} isRanking={true} />
    </div>
  );
}