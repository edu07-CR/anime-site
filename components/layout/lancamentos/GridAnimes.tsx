import { CardAnime, AnimeData } from './CardAnime';

interface GridAnimesProps {
  animes: AnimeData[];
  isLoading: boolean;
}

export function GridAnimes({ animes, isLoading }: GridAnimesProps) {
  // 1. Tela de Carregamento (Skeletons)
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col bg-surface rounded-xl overflow-hidden border border-border animate-pulse">
            <div className="aspect-[2/3] w-full bg-border/30" />
            <div className="p-3">
              <div className="h-4 bg-border/30 rounded w-full mb-2" />
              <div className="h-4 bg-border/30 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Tela Vazia
  if (animes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-4">🍃</span>
        <h3 className="text-lg font-bold text-text">Nenhum lançamento</h3>
        <p className="text-muted text-sm mt-1">Não encontramos animes para este dia.</p>
      </div>
    );
  }

  // 3. Grid de Animes
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {animes.map((anime) => (
        <CardAnime key={anime.id} anime={anime} />
      ))}
    </div>
  );
}