'use client';

import { useState } from 'react';
import { BotaoPostarFeed } from './BotaoPostarFeed';
import { CarrosselImagens } from '@/components/feed/CarrosselImagens';
import { MessageSquareText } from 'lucide-react';

interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: string;
}

export function GeradorCard({ animes, username, feedLiberado }: { animes: AnimeData[], username: string, feedLiberado: boolean }) {
  const [legenda, setLegenda] = useState('');

  // Pega as capas em alta resolução para o carrossel
  const imagensCarrossel = animes.map(anime => 
    anime.coverUrl.replace('/large/', '/extraLarge/')
  );

  return (
    <div className="mt-8 flex flex-col items-center w-full">
      
      {/* PRÉ-VISUALIZAÇÃO DO CARROSSEL */}
      <div className="w-full max-w-md mb-4 bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 border-b border-border flex items-center gap-2 bg-bg/50">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">A</div>
          <span className="text-sm font-bold text-text">@{username}</span>
        </div>
        <CarrosselImagens imagens={imagensCarrossel} isRanking={true} />
      </div>

      {/* CAMPO DE LEGENDA */}
      <div className="w-full max-w-md mb-4">
        <label className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
          <MessageSquareText size={16} /> Legenda do Post
        </label>
        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          placeholder="Escreva algo sobre o seu Top 10..."
          rows={3}
          className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

      {/* BOTÃO DE POSTAR */}
      <div className="w-full max-w-md">
        <BotaoPostarFeed 
          animes={animes} 
          legenda={legenda} 
          feedLiberado={feedLiberado} 
        />
      </div>

    </div>
  );
}