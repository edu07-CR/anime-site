import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, PlayCircle, CheckCircle2, Bookmark, User, MessageCircle } from 'lucide-react';
import { BotaoSeguir } from '@/components/perfil/BotaoSeguir';
import { SeloAdmin } from '@/components/layout/SeloAdmin';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PerfilPublicoPage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, is_admin')
    .ilike('username', resolvedParams.username)
    .single();

  if (!profile) {
    return notFound();
  }

  const isMe = user?.id === profile.id;

  const { data: userAnimes } = await supabase
    .from('user_anime')
    .select('anime_id, status, rating')
    .eq('user_id', profile.id)
    .order('updated_at', { ascending: false });

  let isFollowing = false;
  if (user && !isMe) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id);
  const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id);

  // Como estamos no servidor, o fetch para AniList pode ser feito diretamente
  const animesDetalhes = await Promise.all(
    (userAnimes || []).map(async (item) => {
      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query ($id: Int) { Media(id: $id, type: ANIME) { id title { romaji english } coverImage { large } } }`,
            variables: { id: item.anime_id }
          }),
          next: { revalidate: 86400 }
        });
        if (!res.ok) return null;
        const json = await res.json();
        const media = json.data?.Media;
        if (!media) return null;
        return { 
          id: media.id, 
          title: media.title.english || media.title.romaji, 
          coverUrl: media.coverImage.large, 
          status: item.status, 
          rating: item.rating 
        };
      } catch { return null; }
    })
  );

  const animesValidos = animesDetalhes.filter((a): a is NonNullable<typeof a> => a !== null);
  const assistindo = animesValidos.filter((a) => a.status === 'assistindo');
  const concluidos = animesValidos.filter((a) => a.status === 'concluido');
  const quero = animesValidos.filter((a) => a.status === 'quero');
  const notasValidas = animesValidos.filter((a) => a.rating > 0);
  const mediaNotas = notasValidas.length > 0 ? (notasValidas.reduce((acc, a) => acc + a.rating, 0) / notasValidas.length).toFixed(1) : '0.0';

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      {/* CABEÇALHO PÚBLICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-surface border border-border p-6 md:p-8 rounded-2xl">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-accent bg-surface shadow-lg">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" fill sizes="80px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-accent"><User size={40} /></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-text">{profile.username}</h1>
              {profile.is_admin && <SeloAdmin />}
            </div>
            <p className="text-muted mt-1 text-sm">
              <strong className="text-text">{followersCount || 0}</strong> seguidores • <strong className="text-text">{followingCount || 0}</strong> seguindo
            </p>
          </div>
        </div>
        
        {!isMe && user && (
          <div className="flex items-center gap-3">
            <BotaoSeguir targetUserId={profile.id} initialIsFollowing={isFollowing} />
            <Link 
              href={`/mensagens/${profile.id}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm cursor-pointer"
            >
              <MessageCircle size={18} /> Mensagem
            </Link>
          </div>
        )}
        {isMe && (
          <Link href="/perfil" className="text-sm font-semibold text-accent hover:underline">
            Editar meu perfil
          </Link>
        )}
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface border border-border p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-blue-500 mb-2"><PlayCircle size={24} /></div>
          <p className="text-2xl font-bold text-text">{assistindo.length}</p>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Assistindo</p>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-green-500 mb-2"><CheckCircle2 size={24} /></div>
          <p className="text-2xl font-bold text-text">{concluidos.length}</p>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Concluídos</p>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-yellow-500 mb-2"><Bookmark size={24} /></div>
          <p className="text-2xl font-bold text-text">{quero.length}</p>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Quero Ver</p>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-accent mb-2"><Star size={24} /></div>
          <p className="text-2xl font-bold text-text">{mediaNotas}</p>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Média</p>
        </div>
      </div>

      {/* LISTAS DE ANIMES */}
      <div className="space-y-10">
        {assistindo.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2"><PlayCircle size={20} className="text-blue-500" /> Assistindo</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assistindo.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}
            </div>
          </section>
        )}
        {quero.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2"><Bookmark size={20} className="text-yellow-500" /> Quero Assistir</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {quero.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}
            </div>
          </section>
        )}
        {concluidos.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2"><CheckCircle2 size={20} className="text-green-500" /> Concluídos</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {concluidos.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}
            </div>
          </section>
        )}
        {animesValidos.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
            <p className="text-muted">Este usuário ainda não marcou nenhum anime.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnimeCard({ anime }: { anime: { id: number; title: string; coverUrl: string; rating: number } }) {
  return (
    <Link href={`/anime/${anime.id}`} className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-border hover:border-accent transition-all shadow-sm">
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image 
          src={anime.coverUrl} 
          alt={anime.title} 
          fill 
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" 
          className="object-cover group-hover:scale-110 transition-transform duration-300" 
        />
        {anime.rating > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <Star size={12} fill="currentColor" /> {anime.rating}
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-text line-clamp-2 group-hover:text-accent transition-colors">{anime.title}</h3>
      </div>
    </Link>
  );
}