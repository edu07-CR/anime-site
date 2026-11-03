'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, TrendingUp } from 'lucide-react';

interface Anime {
  id: number;
  title: { romaji: string; english: string };
  coverImage: { large: string };
  averageScore: number;
}

export function TrendingAnimes() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        // Busca os 5 animes mais populares do momento na API do AniList
        const query = `
          query {
            Page(page: 1, perPage: 5) {
              media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
                id
                title { romaji english }
                coverImage { large }
                averageScore
              }
            }
          }
        `;

        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ query })
        });

        const json = await res.json();
        if (json.data?.Page?.media) {
          setAnimes(json.data.Page.media);
        }
      } catch (error) {
        console.error('Erro ao buscar animes em alta:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimes();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-accent" size={24} /></div>;
  }

  if (animes.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-accent" size={20} />
        <h2 className="text-lg font-bold text-text">Em Alta</h2>
      </div>

      <div className="flex flex-col gap-3">
        {animes.map((anime, index) => (
          <Link 
            key={anime.id} 
            href={`/anime/${anime.id}`}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0 bg-border">
              <Image 
                src={anime.coverImage.large} 
                alt={anime.title.romaji} 
                fill 
                sizes="48px" 
                className="object-cover group-hover:scale-105 transition-transform" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">
                {anime.title.romaji}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted mt-1">
                <span className="text-yellow-500 font-bold">★ {anime.averageScore || '?'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <Link href="/destaques" className="block text-center text-sm text-accent font-bold mt-4 hover:underline">
        Ver mais animes
      </Link>
    </div>
  );
}