'use client';

import { CardAnime, AnimeData } from './CardAnime';
import { Loader2 } from 'lucide-react';

export function GridAnimes({ animes, isLoading }: { animes: AnimeData[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (animes.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
        <p className="text-muted">Nenhum anime encontrado para este dia.</p>
      </div>
    );
  }

  return (
    // MESMO GRID E MESMO GAP DA PÁGINA DE PRÓXIMOS
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {animes.map((anime) => (
        <CardAnime key={anime.id} anime={anime} />
      ))}
    </div>
  );
}