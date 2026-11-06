import { NextResponse } from 'next/server';

const PROXIMOS_QUERY = `
  query {
    Page(page: 1, perPage: 50) {
      media(status: NOT_YET_RELEASED, sort: POPULARITY_DESC, type: ANIME) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        description
        startDate { year month day }
        genres
        format
        averageScore
      }
    }
  }
`;

export async function GET() {
  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'User-Agent': 'AniVerse/1.0 (https://www.aniverse.com.br)'
      },
      body: JSON.stringify({ query: PROXIMOS_QUERY }),
      next: { revalidate: 21600 } // Cache de 6 horas
    });

    if (!response.ok) throw new Error('AniList caiu');
    const json = await response.json();
    
    if (json.errors) throw new Error('AniList retornou erro');

    const animes = json.data.Page.media
      .filter((anime: any) => anime.startDate && anime.startDate.year !== null) // Proteção extra
      .map((anime: any) => {
        let dataFormatada = 'Data a definir';
        if (anime.startDate.month && anime.startDate.day) {
          dataFormatada = `${anime.startDate.day.toString().padStart(2, '0')}/${anime.startDate.month.toString().padStart(2, '0')}/${anime.startDate.year}`;
        } else if (anime.startDate.month) {
          dataFormatada = `${anime.startDate.month.toString().padStart(2, '0')}/${anime.startDate.year}`;
        } else {
          dataFormatada = `${anime.startDate.year}`;
        }

        return {
          id: anime.id,
          title: anime.title.english || anime.title.romaji,
          coverUrl: anime.coverImage.large,
          score: anime.averageScore ? anime.averageScore / 10 : null,
          releaseDate: dataFormatada,
          format: anime.format,
          genres: anime.genres || []
        };
      });

    // Ordena do mais próximo para o mais distante
    animes.sort((a: any, b: any) => {
      const dateA = new Date(a.startDate?.year || 9999, (a.startDate?.month || 1) - 1, a.startDate?.day || 1).getTime();
      const dateB = new Date(b.startDate?.year || 9999, (b.startDate?.month || 1) - 1, b.startDate?.day || 1).getTime();
      return dateA - dateB;
    });

    return NextResponse.json({ success: true, animes });

  } catch (error: any) {
    console.error("🚨 Erro ao buscar próximos lançamentos:", error.message);
    return NextResponse.json(
      { error: "Não foi possível carregar os próximos lançamentos." }, 
      { status: 503 }
    );
  }
}