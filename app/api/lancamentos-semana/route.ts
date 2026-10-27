import { NextResponse } from 'next/server';

// A MESMA query que a sua Home usa (que já está funcionando)
const ANILIST_QUERY = `
  query {
    Page(page: 1, perPage: 50) {
      media(status: RELEASING, sort: POPULARITY_DESC, type: ANIME) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        averageScore
        nextAiringEpisode { airingAt timeUntilAiring episode }
      }
    }
  }
`;

export async function GET() {
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: ANILIST_QUERY }),
      next: { revalidate: 21600 } // Cache de 6 horas
    });

    if (!response.ok) throw new Error('Falha na API do AniList');
    const json = await response.json();
    
    if (json.errors) throw new Error('AniList retornou erro');

    // Filtra apenas os que têm próximo episódio e formata os dados
    const animes = json.data.Page.media
      .filter((anime: any) => anime.nextAiringEpisode !== null)
      .map((anime: any) => ({
        id: anime.id,
        title: anime.title.english || anime.title.romaji,
        coverUrl: anime.coverImage.large,
        score: anime.averageScore || 0,
      }));

    return NextResponse.json(animes);

  } catch (error) {
    console.error("Erro na rota /api/lancamentos-semana:", error);
    return NextResponse.json({ error: 'Erro ao buscar animes' }, { status: 500 });
  }
}