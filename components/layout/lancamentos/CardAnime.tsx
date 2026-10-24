import Image from 'next/image';
import Link from 'next/link';

export interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: number;
  formattedTime: string;
  episode: number;
}

export function CardAnime({ anime }: { anime: AnimeData }) {
  return (
    <Link 
      href={`/anime/${anime.id}`} 
      className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-border hover:border-accent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
    >
      {/* Capa */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={anime.coverUrl}
          alt={anime.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badge de Nota */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
          ⭐ {anime.score > 0 ? (anime.score / 10).toFixed(1) : 'N/A'}
        </div>
      </div>

      {/* Informações */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-text line-clamp-2 leading-tight mb-2 group-hover:text-accent transition-colors">
          {anime.title}
        </h3>
        
        <div className="mt-auto flex items-center justify-between text-xs text-muted">
          <span className="bg-border/50 px-2 py-1 rounded text-text font-medium">
            EP {anime.episode}
          </span>
          <span className="flex items-center gap-1">
            🕒 {anime.formattedTime}
          </span>
        </div>
      </div>
    </Link>
  );
}