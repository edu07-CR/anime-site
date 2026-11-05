import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';

// Usamos o client comum (anon) pois não precisa de login
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

// Metadados para o link ficar bonito no WhatsApp/Twitter
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username);
  
  return {
    title: `Top 10 de @${username} | AniVerse`,
    description: `Veja o ranking definitivo de animes de @${username} no AniVerse!`,
  };
}

export default async function Top10PublicoPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username);

  // 1. Busca o perfil pelo username
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('username', username)
    .single();

  if (!profile) return notFound();

  // 2. Busca o Top 10 ordenado
  const { data: top10 } = await supabase
    .from('user_top10')
    .select('position, anime_id')
    .eq('user_id', profile.id)
    .order('position', { ascending: true })
    .limit(10);

  if (!top10 || top10.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted">Este usuário ainda não montou um Top 10.</p>
      </div>
    );
  }

  // 3. Busca as informações de cada anime
  const animesDetalhes = await Promise.all(
    top10.map(async (item) => {
      // Usamos a sua API interna ou direto o AniList (aqui simulando com sua API interna para manter o padrão)
      // Se a sua API interna exigir autenticação, troque para a chamada direta do AniList.
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/anime/${item.anime_id}`, { cache: 'force-cache' });
      if (!res.ok) return null;
      const data = await res.json();
      return { ...data, position: item.position };
    })
  );

  const animesFiltrados = animesDetalhes.filter(Boolean);

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho do Perfil */}
        <div className="flex flex-col items-center mb-12 text-center">
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

        {/* Grid do Top 10 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {animesFiltrados.map((anime: any) => (
            <div key={anime.id} className="relative group rounded-xl overflow-hidden aspect-[2/3] bg-surface border border-border">
              <Image src={anime.coverUrl} alt={anime.title} fill className="object-cover" />
              
              {/* Posição */}
              <div className="absolute top-2 left-2 w-8 h-8 bg-accent text-white font-black rounded-lg flex items-center justify-center shadow-lg">
                #{anime.position}
              </div>
              
              {/* Nota */}
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Star size={10} fill="currentColor" /> {anime.score}
              </div>

              {/* Título */}
              <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white text-xs font-bold line-clamp-2 text-center">{anime.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action (CTA) */}
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