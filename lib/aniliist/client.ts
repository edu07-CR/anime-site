// lib/aniliist/client.ts
import { connection } from 'next/server';
import { SEARCH_ANIME_QUERY, AIRING_SCHEDULE_QUERY, ANIME_DETAILS_QUERY } from './queries';
import { 
  AniListResponse, 
  PageResponse, 
  AiringScheduleResponse, 
  AnimeDetailsResponse, 
  AnimeDetails 
} from './types';

// 1. Função genérica de fetch
export async function anilistFetch<T>(
  query: string, 
  variables?: Record<string, any>,
  revalidateTime: number = 3600 
): Promise<T | null> {
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: revalidateTime }
    });

    if (!response.ok) {
      throw new Error(`Erro na API AniList: ${response.status}`);
    }

    const data = await response.json();
    return data.data as T;
  } catch (error) {
    console.error("Falha no fetch da AniList:", error);
    return null;
  }
}

// 2. Busca por título: Sem cache (0)
export async function searchAnime(search: string, page: number = 1): Promise<PageResponse | null> {
  const data = await anilistFetch<AniListResponse>(SEARCH_ANIME_QUERY, {
    search: search,
    page: page,
    perPage: 10
  }, 0);

  return data ? data.Page : null;
}

// 3. Lançamentos do dia: Cache de 1 hora + Uso do connection() para evitar erro de data
export async function getAiringSchedule(): Promise<AiringScheduleResponse['Page'] | null> {
  await connection(); // <--- Avisa o Next.js que esta função precisa ser dinâmica

  const now = new Date();
  const startOfDay = Math.floor(now.setHours(0, 0, 0, 0) / 1000);
  const endOfDay = Math.floor(now.setHours(23, 59, 59, 999) / 1000);
  
  const data = await anilistFetch<AiringScheduleResponse>(AIRING_SCHEDULE_QUERY, {
    page: 1,
    perPage: 20,
    airingAtGreater: startOfDay,
    airingAtLesser: endOfDay,
  }, 3600);

  return data ? data.Page : null;
}

// 4. Detalhes do Anime: Cache de 24 horas
export async function getAnimeDetails(id: number): Promise<AnimeDetails | null> {
  const data = await anilistFetch<AnimeDetailsResponse>(ANIME_DETAILS_QUERY, { id }, 86400);
  return data ? data.Media : null;
}