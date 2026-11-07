import { NextResponse } from 'next/server';

// ==========================================
// 1. QUERY DO ANILIST (PLANO A)
// ==========================================
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

// ==========================================
// 2. FALLBACK DO JIKAN (Plano B Otimizado)
// ==========================================
async function fetchJikanFallback(diaSelecionado: number) {
  const res = await fetch('https://api.jikan.moe/v4/seasons/now?limit=25&sfw=true', {
    headers: { 'User-Agent': 'AniVerse/1.0 (https://www.aniverse.com.br)' },
    next: { revalidate: 21600 } // Next.js cuida do cache por 6 horas
  });

  if (!res.ok) throw new Error('Jikan falhou ao buscar a temporada');
  
  const json = await res.json();
  const animesDoJikan = json.data;
  const diasDaSemanaIngles = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  
  const animesFiltrados = animesDoJikan.filter((anime: any) => {
    return anime.broadcast?.day && diasDaSemanaIngles.indexOf(anime.broadcast.day) === diaSelecionado;
  });

  return animesFiltrados.map((anime: any) => ({
    id: anime.mal_id,
    title: anime.title_english || anime.title,
    coverUrl: anime.images.webp.large_image_url,
    score: anime.score ? anime.score * 10 : 0, 
    formattedTime: anime.broadcast.time ? anime.broadcast.time : '00:00',
    episode: anime.episodes || 1, // Pega o total de eps direto do objeto
    source: 'jikan' 
  }));
}

// ==========================================
// 3. A ROTA GET
// ==========================================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const diaUrl = searchParams.get('dia');
  const mapaDias: Record<string, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };
  const diaSelecionado = mapaDias[diaUrl || 'qua']; 

  try {
    // ---- TENTATIVA 1: ANILIST ----
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'User-Agent': 'AniVerse/1.0 (https://www.aniverse.com.br)'
      },
      body: JSON.stringify({ query: ANILIST_QUERY }),
      next: { revalidate: 21600 } 
    });

    if (!response.ok) throw new Error('AniList caiu');
    const json = await response.json();
    
    if (json.errors) throw new Error('AniList retornou erro');

    const animesDoAniList = json.data.Page.media
      .filter((anime: any) => anime.nextAiringEpisode !== null)
      .filter((anime: any) => {
        const dataLancamento = new Date(anime.nextAiringEpisode.airingAt * 1000);
        return dataLancamento.getDay() === diaSelecionado;
      })
      .map((anime: any) => {
        const dataLancamento = new Date(anime.nextAiringEpisode.airingAt * 1000);
        const formattedTime = dataLancamento.toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
        });

        return {
          id: anime.id,
          title: anime.title.english || anime.title.romaji,
          coverUrl: anime.coverImage.large,
          score: anime.averageScore || 0,
          formattedTime,
          episode: anime.nextAiringEpisode.episode,
          source: 'anilist'
        };
      });

    return NextResponse.json({ success: true, animesDeHoje: animesDoAniList, source: 'AniList' });

  } catch (error) {
    // ---- TENTATIVA 2: JIKAN (FALLBACK AUTOMÁTICO) ----
    console.warn("⚠️ AniList falhou. Acionando fallback automático (Jikan)...");
    
    try {
      const animesDoJikan = await fetchJikanFallback(diaSelecionado);
      return NextResponse.json({ success: true, animesDeHoje: animesDoJikan, source: 'Jikan (Fallback)' });
      
    } catch (jikanError) {
      // ---- TENTATIVA 3: TUDO FALHOU ----
      console.error("🚨 Ambas as APIs caíram:", jikanError);
      return NextResponse.json(
        { error: "As APIs de anime estão em manutenção. Tente novamente mais tarde.", animesDeHoje: [] }, 
        { status: 503 }
      );
    }
  }
}