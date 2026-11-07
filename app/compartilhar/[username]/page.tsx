import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { CarrosselImagens } from '@/components/feed/CarrosselImagens';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// 1. Função auxiliar para buscar os dados (reutilizada no SEO e na tela)
async function getTop10Data(username: string) {
  const decodedUsername = decodeURIComponent(username);
  const supabase = await createClient();

  // Busca o perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('username', decodedUsername)
    .single();

  if (profileError || !profile) return null;

  // Busca o Top 10
  const { data: top10Data } = await supabase
    .from('user_top10')
    .select('position, anime_id')
    .eq('user_id', profile.id)
    .order('position', { ascending: true })
    .limit(10);

  if (!top10Data || top10Data.length === 0) return { profile, animes: [] };

  // Busca as capas no AniList direto do servidor (com cache de 1 hora)
  const ids = top10Data.map(t => t.anime_id);
  const query = `query ($ids: [Int]) { Page(page: 1, perPage: 50) { media(id_in: $ids, type: ANIME) { id title { romaji } coverImage { extraLarge } averageScore } } }`;
  
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { ids } }),
    next: { revalidate: 3600 } // Cache de 1 hora para ficar super rápido
  });
  
  const anilistJson = await res.json();
  const animesList = anilistJson.data?.Page?.media || [];

  // Junta tudo na ordem certa
  const animes = top10Data.map(item => {
    const info = animesList.find((a: any) => a.id === item.anime_id);
    if (!info) return null;
    return {
      id: info.id,
      title: info.title.romaji,
      coverUrl: info.coverImage.extraLarge,
      score: info.averageScore ? (info.averageScore / 10).toFixed(1) : 'N/A',
      position: item.position
    };
  }).filter(Boolean);

  return { profile, animes };
}

// 2. SEO: Gerando metadados dinâmicos (OpenGraph) com a nossa imagem gerada!
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getTop10Data(resolvedParams.username);

  if (!data || data.animes.length === 0) {
    return { title: 'Top 10 não encontrado | AniVerse' };
  }

  const { profile, animes } = data;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aniverse.com.br';

  // Monta a URL da nossa API de gerar imagem do Top 10!
  const animesParam = encodeURIComponent(JSON.stringify(animes));
  const ogImageUrl = `${baseUrl}/api/top10-image?username=${profile.username}&animes=${animesParam}&tema=padrao`;

  return {
    title: `Top 10 de @${profile.username} | AniVerse`,
    description: `Veja os animes favoritos de @${profile.username}: ${animes.slice(0, 3).map(a => a?.title).join(', ')} e mais!`,
    openGraph: {
      title: `Top 10 de @${profile.username} | AniVerse`,
      description: `O ranking definitivo de animes de @${profile.username}.`,
      images: [
        {
          url: ogImageUrl,
          width: 1080,
          height: 1350,
          alt: `Top 10 de ${profile.username}`,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Top 10 de @${profile.username} | AniVerse`,
      description: `O ranking definitivo de animes de @${profile.username}.`,
      images: [ogImageUrl],
    }
  };
}

// 3. O Componente Principal (Server Component)
export default async function Top10CompartilharPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const data = await getTop10Data(resolvedParams.username);

  if (!data) {
    notFound(); // Exibe a página 404 do Next se o usuário não existir
  }

  const { profile, animes } = data;

  if (animes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <p className="text-muted text-lg">Este usuário ainda não tem um Top 10 salvo.</p>
        <Link href="/" className="text-accent hover:underline">Voltar para a Home</Link>
      </div>
    );
  }

  const imagensCarrossel = animes.map(a => a?.coverUrl).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho do Perfil */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden mb-4 relative bg-surface">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-accent">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-text mb-2">@{profile.username}</h1>
          <p className="text-muted text-lg">Top 10 Animes Favoritos</p>
        </div>

        {/* Carrossel */}
        <div className="w-full max-w-md mx-auto mb-12 bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-border flex items-center gap-2 bg-bg/50">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-text">@{profile.username}</span>
          </div>
          <CarrosselImagens imagens={imagensCarrossel} isRanking={true} />
        </div>

        {/* Lista em Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
          {animes.map((anime: any) => (
            <div key={anime.id} className="relative group rounded-xl overflow-hidden aspect-[2/3] bg-surface border border-border">
              <Image src={anime.coverUrl} alt={anime.title} fill className="object-cover" />
              <div className="absolute top-1 left-1 w-6 h-6 bg-accent text-white font-black text-xs rounded flex items-center justify-center shadow-lg">
                #{anime.position}
              </div>
              <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Star size={8} fill="currentColor" /> {anime.score}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-surface border border-border rounded-2xl p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-text mb-2">Gostou do Top 10?</h2>
          <p className="text-muted mb-6">Crie o seu próprio ranking definitivo de animes no AniVerse. É grátis!</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-3 rounded-xl hover:bg-accent/90 transition-colors"
          >
            Criar meu Top 10 <ArrowRight size={20} />
          </Link>
        </div>

      </div>
    </div>
  );
}