// lib/date-utils.ts
import { AiringSchedule, AnimeCardData } from "./aniliist/types";
import { mapAnimeToCard } from "./aniliist/mappers";

// Converte o timestamp da AniList para o dia da semana no Brasil
export function getBrazilianWeekday(timestampInSeconds: number): string {
  const date = new Date(timestampInSeconds * 1000);
  
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  });

  const weekday = formatter.format(date);
  // Capitaliza a primeira letra (ex: "segunda-feira" -> "Segunda-feira")
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

// Formata a hora de exibição no Brasil (ex: "21:30")
export function formatBrazilianTime(timestampInSeconds: number): string {
  const date = new Date(timestampInSeconds * 1000);
  
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Agrupa uma lista de animes por dia da semana no Brasil
export function groupAnimesByWeekday(animes: AiringSchedule[]) {
  const grouped: Record<string, AiringSchedule[]> = {};

  animes.forEach((anime) => {
    const weekday = getBrazilianWeekday(anime.airingAt);

    if (!grouped[weekday]) {
      grouped[weekday] = [];
    }
    
    grouped[weekday].push(anime);
  });

  return grouped;
}

// Interface que junta os dados do card com o horário de exibição
export interface AiringAnimeWithTime extends AnimeCardData {
  airingAt: number;
  formattedTime: string;
  episode: number;
}

export function getAnimesByWeekday(
  scheduleList: AiringSchedule[], 
  targetWeekday: string
): AiringAnimeWithTime[] {
  
  // 1. Filtra apenas os animes que caem no dia da semana escolhido
  const filteredAnimes = scheduleList.filter((anime) => {
    const weekday = getBrazilianWeekday(anime.airingAt);
    return weekday.toLowerCase() === targetWeekday.toLowerCase();
  });

  // 2. Mapeia (normaliza) os dados e adiciona o horário formatado
  const normalizedList = filteredAnimes.map((anime) => {
    const cardData = mapAnimeToCard(anime.media);
    
    return {
      ...cardData,
      airingAt: anime.airingAt,
      formattedTime: formatBrazilianTime(anime.airingAt),
      episode: anime.episode,
    };
  });

  // 3. Ordena do mais cedo para o mais tarde no dia
  return normalizedList.sort((a, b) => a.airingAt - b.airingAt);
}
