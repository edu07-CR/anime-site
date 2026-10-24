// lib/aniliist/mappers.ts
import { AniListAnime, AnimeCardData } from './types';

// Transforma um anime vindo da AniList no formato interno do nosso site
export function mapAnimeToCard(anime: AniListAnime): AnimeCardData {
  // Lógica inteligente para escolher o melhor título (Inglês, senão Romaji)
  const bestTitle = anime.title.english || anime.title.romaji;

  return {
    id: anime.id,
    title: bestTitle,
    coverUrl: anime.coverImage.large,
    score: anime.averageScore ? anime.averageScore / 10 : 0, // A AniList usa nota de 0-100, vamos converter para 0-10
  };
}

// Bônus: Função para transformar uma lista inteira de uma vez
export function mapAnimeListToCards(animes: AniListAnime[]): AnimeCardData[] {
  return animes.map(mapAnimeToCard);
}