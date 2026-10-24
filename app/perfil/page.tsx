import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, PlayCircle, CheckCircle2, Bookmark, Star } from 'lucide-react';
import { SelecionarAvatar } from '@/components/perfil/SelecionarAvatar';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 1. Busca perfil (nome, avatar)
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  // 2. Busca todos os animes salvos pelo usuário
  const { data: userAnimes } = await supabase
    .from('user_anime')
    .select('anime_id, status, rating')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  // 3. Define a URL base corretamente (remove a barra do final se existir)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '') 
    : 'http://localhost:3000';

  // 4. Busca os detalhes de cada anime na nossa API interna
  const animesDetalhes = await Promise.all(
    (userAnimes || []).map(async (item) => {
      try {
        const apiUrl = `${siteUrl}/api/anime/${item.anime_id}`;
        
        // Log para vermos no terminal da Vercel o que está sendo buscado
        console.log(`🔍 Buscando detalhes do anime: ${apiUrl}`);
        
        const res = await fetch(apiUrl, {
          next: { revalidate: 3600 }
        });

        if (!res.ok) {
          console.error(`🚨 Erro na API para o ID ${item.anime_id}: Status ${res.status}`);
          return null;
        }

        const data = await res.json();
        return { ...data, status: item.status, rating: item.rating };
      } catch (error) {
        console.error(`🚨 Erro no fetch para o ID ${item.anime_id}:`, error);
        return null;
      }
    })
  );

  // Filtra nulos e separa por status
  const animesValidos = animesDetalhes.filter(Boolean);
  const assistindo = animesValidos.filter(a => a.status === 'assistindo');
  const concluidos = animesValidos.filter(a => a.status === 'concluido');
  const quero = animesValidos.filter(a => a.status === 'quero');

  // 5. Calcula a média de notas
  const notasValidas = animesValidos.filter(a => a.rating > 0);
  const mediaNotas = notasValidas.length > 0 
    ? (notasValidas.reduce((acc, a) => acc + a.rating, 0) / notasValidas.length).toFixed(1) 
    : '0.0';

  const nomeExibicao = profile?.username || user.email;

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      
      {/* CABEÇALHO DO PERFIL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-surface border border-border p-6 md:p-8 rounded-2xl">
        <div className="flex items-center gap-5">
          <SelecionarAvatar avatarAtual={profile?.avatar_url || ''} />
          <div>
            <h1 className="text-3xl font-bold text-text">{nomeExibicao}</h1>
            <p className="text-muted mt-1">Bem-vindo ao seu espaço no AniVerse.</p>
          </div>
        </div>
        
        <Link 
          href="/perfil/configuracoes" 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bg border border-border text-text rounded-lg hover:border-accent hover:text-accent transition-colors font-medium text-sm cursor-pointer w-fit"
        >
          <Settings size={18} /> Configurações
        </Link>
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
        
        {/* ASSISTINDO */}
        {assistindo.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
              <PlayCircle size={20} className="text-blue-500" /> Assistindo
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assistindo.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </section>
        )}

        {/* QUERO ASSISTIR */}
        {quero.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
              <Bookmark size={20} className="text-yellow-500" /> Quero Assistir
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {quero.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </section>
        )}

        {/* CONCLUÍDOS */}
        {concluidos.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-500" /> Concluídos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {concluidos.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </section>
        )}

        {/* SE ESTIVER VAZIO */}
        {animesValidos.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
            <p className="text-muted">Você ainda não marcou nenhum anime.</p>
            <Link href="/" className="text-accent font-bold hover:underline mt-2 inline-block">
              Explorar Lançamentos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Componente do Card de Anime ---
function AnimeCard({ anime }: { anime: any }) {
  return (
    <Link 
      href={`/anime/${anime.id}`} 
      className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-border hover:border-accent transition-all shadow-sm"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image src={anime.coverUrl} alt={anime.title} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-110 transition-transform duration-300" />
        
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