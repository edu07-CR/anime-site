// lib/aniliist/types.ts

export interface AniListAnime {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string;
  };
  coverImage: {
    large: string;
  };
  format: string;
  status: string;
  episodes: number | null;
  averageScore: number | null;
}

export interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface PageResponse {
  pageInfo: PageInfo;
  media: AniListAnime[];
}

export interface AniListResponse {
  Page: PageResponse;
}

// Tipos para os Lançamentos da Semana
export interface AiringSchedule {
  id: number;
  airingAt: number;
  episode: number;
  media: AniListAnime; 
}

export interface AiringScheduleResponse {
  Page: {
    pageInfo: PageInfo;
    airingSchedules: AiringSchedule[];
  };
}

// Tipos para os Detalhes do Anime
export interface AnimeDetails {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string;
  };
  description: string;
  coverImage: {
    extraLarge: string;
    large: string;
  };
  bannerImage: string | null;
  format: string;
  status: string;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  genres: string[];
  studios: {
    nodes: { name: string }[];
  };
  trailer: {
    id: string;
    site: string;
  } | null;
}

export interface AnimeDetailsResponse {
  Media: AnimeDetails;
}

// O formato PADRÃO que o SEU SITE vai usar (independente da API)
export interface AnimeCardData {
  id: number;
  title: string;
  coverUrl: string;
  score: number;
}