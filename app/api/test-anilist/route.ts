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
// 2. FUNÇÃO DO JIKAN (PLANO B)
// ==========================================
async function fetchJikanFallback(diaSelecionado: number) {
  const res = await fetch('https://api.jikan.moe/v4/seasons/now?limit=25&sfw=true', {
    next: { revalidate: 21600 } // Cache de 6 horas
  });

  if (!res.ok) throw new Error('Jikan também falhou');
  
  const json = await res.json();
  const animesDoJikan = json.data;

  // Traduzindo o formato do Jikan para o formato do AniList (que o seu site já usa)
  const animesFormatados = animesDoJikan
    .map((anime: any) => {
      // O Jikan traz os horários no padrão "Wednesdays" (Quartas)
      const diasDaSemanaIngles = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
      const diasDaSemanaPt = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const diaDoAnimeIngles = anime.broadcast?.day;

      // Verifica se o anime passa no dia selecionado
      if (!diaDoAnimeIngles || diasDaSemanaIngles.indexOf(diaDoAnimeIngles) !== diaSelecionado) {
        return null; // Descarta se não for do dia
      }

      return {
        id: anime.mal_id,
        title: anime.title_english || anime.title,
        coverUrl: anime.images.webp.large_image_url,
        score: anime.score ? anime.score * 10 : 0, // Jikan usa 0-10, AniList usa 0-100
        formattedTime: anime.broadcast.time ? anime.broadcast.time : '00:00',
        episode: anime.episodes || 1, // Se não tiver episódio definido, assume 1
        source: 'jikan' // Apenas para debug, caso queira saber de onde veio
      };
    })
    .filter((anime: any) => anime !== null); // Remove os nulos

  return animesFormatados;
}

// ==========================================
// 3. A ROTA GET (O Cérebro)
// ==========================================
export async function GET(req: Request) {
  // Pega o dia da URL (ex: ?dia=2)
  const { searchParams } = new URL(req.url);
  const diaUrl = searchParams.get('dia');
  // Converte 'qua' para o número 3 (Domingo=0, Segunda=1...)
  const mapaDias: Record<string, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };
  const diaSelecionado = mapaDias[diaUrl || 'qua']; // Fallback para quarta se não vier nada

  try {
    // ---- TENTATIVA 1: ANILIST ----
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: ANILIST_QUERY }),
      next: { revalidate: 21600 } // Cache de 6 horas
    });

    if (!response.ok) throw new Error('AniList caiu');
    const json = await response.json();
    
    if (json.errors) throw new Error('AniList retornou erro');

    // Filtra os animes que são do dia selecionado
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
    // ---- TENTATIVA 2: JIKAN (FALLBACK) ----
    console.warn("⚠️ AniList falhou ou está fora do ar. Acionando plano B (Jikan)...");
    
    try {
      const animesDoJikan = await fetchJikanFallback(diaSelecionado);
      return NextResponse.json({ success: true, animesDeHoje: animesDoJikan, source: 'Jikan' });
      
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