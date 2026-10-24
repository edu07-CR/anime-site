import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Calcular a temporada atual baseada na data de hoje (Fuso de SP)
    const dataHoje = new Date();
    const mes = parseInt(dataHoje.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'numeric' }));
    const ano = parseInt(dataHoje.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric' }));

    let temporada = 'WINTER';
    if (mes >= 4 && mes <= 6) temporada = 'SPRING';
    else if (mes >= 7 && mes <= 9) temporada = 'SUMMER';
    else if (mes >= 10 && mes <= 12) temporada = 'FALL';

    // 2. Query buscando as 3 categorias
    const query = `
      query ($temporada: MediaSeason, $ano: Int) {
        # 1. Destaques do Dia (Trending)
        doDia: Page(page: 1, perPage: 5) {
          media(type: ANIME, sort: TRENDING_DESC) {
            id
            title { romaji english }
            coverImage { large }
            averageScore
            episodes
          }
        }
        
        # 2. Destaques da Semana (Animes em exibição, mais populares)
        daSemana: Page(page: 1, perPage: 5) {
          media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            coverImage { large }
            averageScore
            episodes
            nextAiringEpisode { episode }
          }
        }

        # 3. Destaques da Temporada
        daTemporada: Page(page: 1, perPage: 5) {
          media(season: $temporada, seasonYear: $ano, type: ANIME, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            coverImage { large }
            averageScore
            episodes
          }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        variables: { temporada, ano } 
      }),
      next: { revalidate: 21600 } // Cache de 6 horas
    });

    if (!res.ok) throw new Error('AniList falhou');
    const json = await res.json();
    if (json.errors) throw new Error('Erro na query do AniList');

    // Função para formatar os dados
    const formatar = (media: any[]) => {
      if (!media) return [];
      return media.map((m) => ({
        id: m.id,
        title: m.title.english || m.title.romaji,
        coverUrl: m.coverImage.large,
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : 'N/A',
        episodes: m.nextAiringEpisode?.episode || m.episodes || '?'
      }));
    };

    return NextResponse.json({
      doDia: formatar(json.data?.doDia?.media || []),
      daSemana: formatar(json.data?.daSemana?.media || []),
      daTemporada: formatar(json.data?.daTemporada?.media || []),
    });

  } catch (error: any) {
    console.error("Erro fatal nos destaques:", error.message);
    return NextResponse.json({ 
      doDia: [], 
      daSemana: [], 
      daTemporada: [], 
      error: "Não foi possível carregar os destaques."
    }, { status: 200 }); 
  }
}