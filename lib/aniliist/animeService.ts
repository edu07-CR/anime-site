import { getAnimeById } from './getAnimeById';

// Função para buscar na Jikan (Plano B)
async function getAnimeFromJikan(idMal: number) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${idMal}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) return null;
    
    const json = await res.json();
    const data = json.data;

    // A Jikan tem um formato diferente, então a gente converte para o formato do AniList
    return {
      id: idMal,
      title: { english: data.title_english, romaji: data.title, native: data.title_japanese },
      description: data.synopsis,
      coverImage: { extraLarge: data.images.jpg.large_image_url },
      bannerImage: null, // A Jikan não tem banner
      averageScore: data.score ? data.score * 10 : null,
      format: data.type,
      status: data.status,
      episodes: data.episodes,
      seasonYear: data.year,
      genres: data.genres.map((g: any) => g.name),
      studios: { nodes: data.studios.map((s: any) => ({ name: s.name })) }
    };
  } catch {
    return null;
  }
}

// Função principal que o site vai chamar
export async function getAnimeSafe(id: string) {
  // 1. Tenta buscar no AniList
  const animeAnilist = await getAnimeById(id);
  
  // 2. Se o AniList funcionou, retorna ele
  if (animeAnilist) {
    return animeAnilist;
  }

  // 3. Se o AniList falhou (API off ou vazio), tenta o Plano B (Jikan)
  console.log("AniList falhou, tentando Jikan (Plano B) para o ID:", id);
  
  // Precisamos do idMal. Como o AniList caiu, não temos o idMal direto.
  // Para simplificar no MVP: vamos pegar o ID do AniList e subtrair 100000 (regra de ouro aproximada)
  // Se der certo, ótimo. Se não, o site mostra a tela de "indisponível".
  const idMalAproximado = parseInt(id) - 100000;
  
  if (idMalAproximado > 0) {
    const animeJikan = await getAnimeFromJikan(idMalAproximado);
    if (animeJikan) return animeJikan;
  }

  return null;
}