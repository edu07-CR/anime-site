import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { AcoesAnime } from '@/components/anime/AcoesAnime';
import { BotaoTrailer } from '@/components/anime/BotaoTrailer';
import { SecaoComentarios } from '@/components/anime/SecaoComentarios'; 
import { EspacoAnuncio } from '@/components/layout/EspacoAnuncio';
import { OndeAssistir } from '@/components/anime/OndeAssistir';
import { BannerGeek } from '@/components/anime/BannerGeek';

// ==========================================
// FUNÇÕES DE TRADUÇÃO E BUSCA
// ==========================================
async function traduzirComGroq(texto: string) {
  const API_KEY = process.env.GROQ_API_KEY; 
  if (!API_KEY) return null;
  const prompt = `Traduza a seguinte sinopse de anime para o português do Brasil. Retorne APENAS o texto traduzido: "${texto}"`;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: [{ role: "system", content: "Você é um tradutor profissional de animes." }, { role: "user", content: prompt }], temperature: 0.3 })
    });
    if (!res.ok) throw new Error(`Groq HTTP: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null; 
  } catch (error) { return null; }
}

async function traduzirComGemini(texto: string) {
  const API_KEY = process.env.GEMINI_API_KEY; 
  if (!API_KEY) return null; 
  const prompt = `Traduza a seguinte sinopse de anime para o português do Brasil. Retorne APENAS o texto traduzido: "${texto}"`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!res.ok) throw new Error(`Gemini HTTP: ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null; 
  } catch (error) { return null; }
}

async function traduzirTexto(texto: string) {
  let traducao = await traduzirComGroq(texto);
  if (traducao) return traducao;
  traducao = await traduzirComGemini(texto);
  if (traducao) return traducao;
  return texto;
}

async function getAnimeFromAniList(id: string) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id title { romaji english } coverImage { extraLarge large } bannerImage
        description(asHtml: false) genres status episodes seasonYear
        studios(isMain: true) { nodes { name } } averageScore trailer { id site }
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { id: parseInt(id) } }), next: { revalidate: 86400 } 
  });
  if (!res.ok) throw new Error('AniList HTTP Error');
  const json = await res.json();
  if (json.errors || !json.data.Media) return null;
  const anime = json.data.Media;
  if (anime.description) {
    const textoLimpo = anime.description.replace(/<[^>]*>?/gm, '');
    anime.description = await traduzirTexto(textoLimpo); 
  }
  return anime;
}

async function getAnimeFromJikan(id: string) {
  const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const json = await res.json();
  const data = json.data;
  if (!data) return null;
  let sinopse = data.synopsis || 'Sem sinopse disponível.';
  if (sinopse !== 'Sem sinopse disponível.') { sinopse = await traduzirTexto(sinopse); }
  return {
    id: data.mal_id, title: { english: data.title_english, romaji: data.title },
    coverImage: { extraLarge: data.images.webp.large_image_url, large: data.images.webp.large_image_url },
    bannerImage: data.trailer?.images?.maximum_image_url || null, description: sinopse,
    genres: data.genres?.map((g: any) => g.name) || [],
    status: data.status === 'Currently Airing' ? 'RELEASING' : 'FINISHED',
    episodes: data.episodes, seasonYear: data.year,
    studios: { nodes: data.studios?.map((s: any) => ({ name: s.name })) || [] },
    averageScore: data.score ? data.score * 10 : 0, 
    trailer: data.trailer?.youtube_id ? { id: data.trailer.youtube_id, site: 'youtube' } : null
  };
}

async function getAnimeDetails(id: string) {
  try {
    const anime = await getAnimeFromAniList(id);
    if (anime) return anime;
    throw new Error('Anime não encontrado no AniList');
  } catch (error) {
    try { return await getAnimeFromJikan(id); } catch (jikanError) { return null; }
  }
}

// ==========================================
// COMPONENTE DA PÁGINA
// ==========================================
export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anime = await getAnimeDetails(id);

  if (!anime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold text-text mb-4">Anime não encontrado</h1>
        <Link href="/" className="text-accent hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar para a Home
        </Link>
      </div>
    );
  }

  const title = anime.title.english || anime.title.romaji;
  const studio = anime.studios?.nodes?.[0]?.name || 'Estúdio Desconhecido';
  const sinopse = anime.description || 'Sem sinopse disponível.';

  return (
    <div className="relative w-full -mt-6">
      
      {/* Fundo Imersivo */}
      <div className="absolute top-0 left-0 w-full h-[40vh] md:h-[50vh] -z-10 overflow-hidden">
        <Image
          src={anime.bannerImage || anime.coverImage.large}
          alt={`Banner de ${title}`}
          fill sizes="100vw" className="object-cover blur-sm opacity-40 scale-105" priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/80 to-bg" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-32 pb-12 flex flex-col lg:flex-row gap-8">
        
        {/* COLUNA ESQUERDA (CONTEÚDO PRINCIPAL) */}
        <div className="flex-1 w-full">
          
          {/* ANÚNCIO NO TOPO */}
          <div className="mb-8">
            <EspacoAnuncio formato="banner" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {/* PÔSTER + TRAILER + ANÚNCIO LATERAL ESQUERDO */}
            <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col gap-6">
              <div className="relative aspect-[2/3] w-full max-w-[300px] mx-auto md:mx-0 rounded-xl overflow-hidden border-2 border-border shadow-2xl shadow-black/50">
                <Image 
                  src={anime.coverImage.extraLarge || anime.coverImage.large} 
                  alt={title} fill sizes="(max-width: 768px) 300px, 25vw" className="object-cover" priority 
                />
              </div>
              <div className="w-full max-w-[300px] mx-auto md:mx-0">
                <BotaoTrailer 
                  trailerId={anime.trailer?.site === 'youtube' ? anime.trailer.id : undefined} 
                  tituloAnime={title}
                />
              </div>
              <div className="w-full max-w-[300px] mx-auto md:mx-0 hidden md:block">
                <EspacoAnuncio formato="vertical" />
              </div>
            </div>

            {/* INFORMAÇÕES + SINOPSE + COMENTÁRIOS */}
            <div className="w-full md:w-2/3 flex flex-col">
              
              {/* Informações Básicas (Contraste Melhorado) */}
              <div className="flex items-center gap-3 mb-2 text-text/80 text-sm font-semibold">
                <span>{anime.seasonYear || 'Ano Desconhecido'}</span>
                <span>•</span>
                <span>{anime.status === 'RELEASING' ? 'Em exibição' : 'Finalizado'}</span>
                <span>•</span>
                <span>{anime.episodes || '?'} Episódios</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-text mb-4 leading-tight">
                {title}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                {/* Nota com Cores Melhoradas */}
                <div className="flex items-center gap-1 text-yellow-600 font-bold text-lg bg-yellow-400/20 px-3 py-1 rounded-lg border border-yellow-400/30">
                  <Star size={20} fill="currentColor" />
                  {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}
                </div>
                {/* Estúdio com Contraste Melhorado */}
                <div className="text-text/80 text-sm">
                  Estúdio: <span className="text-text font-medium">{studio}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {anime.genres?.map((genre: string) => (
                  <span key={genre} className="px-3 py-1 text-xs font-semibold bg-surface border border-border rounded-full text-text/80">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-5">
                <AcoesAnime animeId={anime.id} />
                <div className="-mt-4">
                  <OndeAssistir tituloAnime={title} animeId={anime.id} />
                </div>
                
                {/* BANNER DE PRODUTOS GEEK */}
                <BannerGeek tituloAnime={title} />
              </div>

              {/* SINOPSE com Contraste Melhorado */}
              <div className="mb-8 mt-6">
                <h2 className="text-xl font-bold text-text mb-3">Sinopse</h2>
                <p className="text-text/80 leading-relaxed text-sm md:text-base">
                  {sinopse}
                </p>
              </div>

              <SecaoComentarios animeId={anime.id} />
            </div>
          </div>

          {/* ANÚNCIO NO FINAL */}
          <div className="mt-10">
            <EspacoAnuncio formato="banner" />
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Link href="/" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
              <ArrowLeft size={16} /> Voltar para os Lançamentos
            </Link>
          </div>
        </div>

        {/* COLUNA DIREITA (ANÚNCIO LATERAL FINO) */}
        <div className="hidden lg:block w-40 flex-shrink-0">
          <div className="sticky top-24">
            <EspacoAnuncio formato="vertical" />
          </div>
        </div>

      </div>
    </div>
  );
}