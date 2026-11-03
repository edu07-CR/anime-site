import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, PlayCircle, CheckCircle2, Bookmark, User, MessageCircle, Crown, Trophy } from 'lucide-react';
import { BotaoSeguir } from '@/components/perfil/BotaoSeguir';
import { BotaoBloquear } from '@/components/perfil/BotaoBloquear';
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

  // --- BUSCA A SEMANA ATUAL DIRETO DO BANCO ---
  const { data: dataSemana } = await supabase.rpc('get_semana_atual');
  const periodoAtual = dataSemana || '';

  // 1. BUSCA O SELO DA SEMANA ATUAL
  const { data: conquistaSemana } = await supabase
    .from('user_achievements')
    .select('tipo, periodo')
    .eq('user_id', profile.id)
    .eq('tipo', 'top_semana')
    .eq('periodo', periodoAtual)
    .maybeSingle();

  const isTopSemana = !!conquistaSemana;

  // 2. BUSCA O HISTÓRICO COMPLETO
  const { data: historicoConquistas } = await supabase
    .from('user_achievements')
    .select('tipo, periodo, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  // ... (MANTIDO O RESTO DO CÓDIGO DE ANIMES, SEGUIDORES, ETC) ...

  const { data: userAnimes } = await supabase
    .from('user_anime')
    .select('anime_id, status, rating')
    .eq('user_id', profile.id)
    .order('updated_at', { ascending: false });

  let isFollowing = false;
  let isBlocked = false;

  if (user && !isMe) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle();
    isFollowing = !!follow;

    const { data: block } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', profile.id)
      .maybeSingle();
    isBlocked = !!block;
  }

  const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id);
  const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id);

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
        return { id: media.id, title: media.title.english || media.title.romaji, coverUrl: media.coverImage.large, status: item.status, rating: item.rating };
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 bg-surface border border-border p-6 md:p-8 rounded-2xl">
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
              
              {/* COROA - AGORA COM O PERÍODO CORRETO DO BANCO */}
              {isTopSemana && (
                <div className="flex items-center justify-center bg-yellow-500/20 text-yellow-500 p-1.5 rounded-full border border-yellow-500/50" title="Top Criador da Semana">
                  <Crown size={20} />
                </div>
              )}
              {profile.is_admin && <SeloAdmin />}
            </div>
            <p className="text-muted mt-1 text-sm">
              <strong className="text-text">{followersCount || 0}</strong> seguidores • <strong className="text-text">{followingCount || 0}</strong> seguindo
            </p>
          </div>
        </div>
        
        {!isMe && user && (
          <div className="flex items-center gap-3 flex-wrap">
            <BotaoSeguir targetUserId={profile.id} initialIsFollowing={isFollowing} />
            <BotaoBloquear targetUserId={profile.id} initialIsBlocked={isBlocked} />
            <Link href={`/mensagens/${profile.id}`} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm cursor-pointer">
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

      {/* GALERIA DE CONQUISTAS */}
      {historicoConquistas && historicoConquistas.length > 0 && (
        <div className="bg-surface border border-border p-6 rounded-2xl mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-accent" size={24} />
            <h2 className="text-xl font-bold text-text">Galeria de Conquistas</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {historicoConquistas.map((conquista, index) => {
              const partesPeriodo = conquista.periodo.split('-');
              const anoConquista = partesPeriodo[0];
              const semanaConquista = partesPeriodo[1]?.replace('W', '');
              
              return (
                <div key={index} className="flex flex-col items-center justify-center bg-bg border border-border p-4 rounded-xl min-w-[120px] shadow-sm">
                  <div className="bg-yellow-500/10 text-yellow-500 p-2 rounded-full mb-2">
                    <Crown size={24} />
                  </div>
                  <span className="text-xs font-bold text-text text-center">Top Criador</span>
                  <span className="text-[10px] text-muted text-center mt-1">
                    Semana {semanaConquista} de {anoConquista}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ESTATÍSTICAS E LISTAS (MANTIDO IGUAL) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {/* ... */}
      </div>
      <div className="space-y-10">
        {/* ... */}
      </div>
    </div>
  );
}