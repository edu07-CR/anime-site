'use client';

import { useState, useEffect, useOptimistic, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Sparkles, Heart, MessageCircle, AlertTriangle, X, Trash2, PlusCircle, Share2, Trophy, BarChart2, Flag, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CarrosselImagens } from '@/components/feed/CarrosselImagens';
import { ModalComentarios } from '@/components/feed/ModalComentarios';
import { toggleLike } from '@/app/actions/feed';
import { deletarPost } from '@/app/actions/posts';
import { SeloAdmin } from '@/components/layout/SeloAdmin';
import { TopCriadores } from '@/components/feed/TopCriadores';
import { TrendingAnimes } from '@/components/feed/TrendingAnimes';
import { CriadorPost } from '@/components/feed/CriadorPost';
import { BannerGlobal } from '@/components/feed/BannerGlobal';
import { EspacoAnuncio } from '@/components/layout/EspacoAnuncio';
import { TelaBloqueio } from '@/components/layout/TelaBloqueio';

const supabase = createClient();

interface Post {
  id: string;
  user_id: string;
  media_url: string | null;
  media_urls: string[] | null;
  media_type: string;
  caption: string | null;
  has_spoiler: boolean;
  created_at: string;
  is_ranking: boolean;
  is_poll: boolean;
  poll_options: string[] | null;
  profiles: { username: string; avatar_url: string; is_admin: boolean } | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  votes: { option_index: number; count: number }[];
  user_vote_index: number | null;
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedBloqueado, setFeedBloqueado] = useState(false);
  const [imagemAberta, setImagemAberta] = useState<Post | null>(null);
  const [postComentariosAberto, setPostComentariosAberto] = useState<Post | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [criadorAberto, setCriadorAberto] = useState(false);
  const [curtindo, setCurtindo] = useState<string | null>(null);
  const [topMensalUserId, setTopMensalUserId] = useState<string | null>(null);
  const [votando, setVotando] = useState(false);

  const getImagensOrdenadas = (post: Post) => {
    if (!post.media_urls || post.media_urls.length === 0) {
      return post.media_url ? [post.media_url] : [];
    }
    return post.media_urls; 
  };

  const [optimisticLikes, addOptimisticLike] = useOptimistic<
    Post[],
    { postId: string; isLiked: boolean }
  >(
    posts,
    (state, { postId, isLiked }) => {
      return state.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            user_has_liked: !isLiked,
            likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
          };
        }
        return p;
      });
    }
  );

  useEffect(() => {
    const checkAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const isDev = process.env.NODE_ENV === 'development';
      
      if (!isDev) {
        const { data: config } = await supabase.from('site_config').select('feed_enabled').single();
        if (config?.feed_enabled === false) {
          setFeedBloqueado(true);
          setLoading(false);
          return;
        }
      }

      setCurrentUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (profile?.is_admin) setIsAdmin(true);

      // --- BUSCA O TOP CRIADOR MENSAL ---
      const dataAtual = new Date();
      const periodoMesAtual = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`;

      const { data: topMensal } = await supabase
        .from('user_achievements')
        .select('user_id')
        .eq('tipo', 'top_mes')
        .eq('periodo', periodoMesAtual)
        .maybeSingle();

      if (topMensal) {
        setTopMensalUserId(topMensal.user_id);
      }
      // ----------------------------------

      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);
      
      const ids = blocks?.map(b => b.blocked_id) || [];

      let query = supabase
        .from('posts')
        .select(`
          id, user_id, media_url, media_urls, media_type, caption, has_spoiler, created_at, is_ranking, is_poll, poll_options,
          profiles (username, avatar_url, is_admin)
        `)
        .order('created_at', { ascending: false });

      if (ids.length > 0) {
        query = query.not('user_id', 'in', `(${ids.join(',')})`);
      }

      const { data: postsData } = await query;

      if (postsData) {
        const postsComContagem = await Promise.all(
          postsData.map(async (post) => {
            const { count: likes } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
            const { count: comments } = await supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
            
            let user_has_liked = false;
            if (user) {
              const { data: like } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
              user_has_liked = !!like;
            }

            let votes: { option_index: number; count: number }[] = [];
            let user_vote_index = null;

            if (post.is_poll) {
              const { data: allVotes } = await supabase
                .from('poll_votes')
                .select('option_index')
                .eq('post_id', post.id);

              if (allVotes) {
                const counts: Record<number, number> = {};
                allVotes.forEach(v => {
                  counts[v.option_index] = (counts[v.option_index] || 0) + 1;
                });
                votes = Object.keys(counts).map(k => ({
                  option_index: parseInt(k),
                  count: counts[parseInt(k)]
                }));
              }

              if (user) {
                const { data: myVote } = await supabase
                  .from('poll_votes')
                  .select('option_index')
                  .eq('post_id', post.id)
                  .eq('user_id', user.id)
                  .maybeSingle();
                user_vote_index = myVote ? myVote.option_index : null;
              }
            }

            return {
              ...post,
              likes_count: likes || 0,
              comments_count: comments || 0,
              user_has_liked,
              votes,
              user_vote_index
            };
          })
        );
        setPosts(postsComContagem as unknown as Post[]);
      }
      setLoading(false);
    };

    checkAndFetch();
  }, []);

  const handleLike = (post: Post) => {
    if (curtindo === post.id) return; 
    setCurtindo(post.id);

    startTransition(async () => {
      addOptimisticLike({ postId: post.id, isLiked: post.user_has_liked });
      
      try {
        await toggleLike(post.id, post.user_has_liked);
        setPosts((prev) => 
          prev.map((p) => 
            p.id === post.id 
              ? { ...p, user_has_liked: !post.user_has_liked, likes_count: post.user_has_liked ? p.likes_count - 1 : p.likes_count + 1 } 
              : p
          )
        );
      } catch (error) {
        console.error(error);
      } finally {
        setCurtindo(null);
      }
    });
  };

  const handleVotar = async (postId: string, optionIndex: number) => {
    if (votando) return;
    setVotando(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      alert("Sua sessão expirou. Faça login novamente.");
      setVotando(false);
      return;
    }

    // --- BLOQUEIO DE AUTO-VOTO ---
    const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (postData?.user_id === user.id) {
      alert("Você não pode votar na sua própria enquete!");
      setVotando(false);
      return;
    }

    const { error } = await supabase.from('poll_votes').insert({
      post_id: postId,
      user_id: user.id,
      option_index: optionIndex
    });

    if (error) {
      console.error("Erro ao votar:", error);
      alert("Erro ao votar: " + error.message);
      setVotando(false);
      return;
    }

    setPosts(prev => 
      prev.map(p => {
        if (p.id === postId) {
          const newVotes = [...p.votes];
          const existingVote = newVotes.find(v => v.option_index === optionIndex);
          if (existingVote) {
            existingVote.count += 1;
          } else {
            newVotes.push({ option_index: optionIndex, count: 1 });
          }
          return { ...p, votes: newVotes, user_vote_index: optionIndex };
        }
        return p;
      })
    );

    setVotando(false);
  };

  const handleDeletar = async (post: Post) => {
    if (!confirm('Tem certeza que deseja deletar este post?')) return;

    try {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      await deletarPost(post.id, post.media_urls || []);
      router.refresh(); 
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar o post.');
      router.refresh();
    }
  };

  const handleDenunciar = async (post: Post) => {
    const motivo = prompt("Por que você está denunciando este post? (ex: Spam, Ofensa, Conteúdo impróprio)");
    if (!motivo) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('post_reports').insert({
      post_id: post.id,
      reporter_id: user.id,
      reason: motivo
    });

    if (error) {
      if (error.code === '23505') { // Erro de chave duplicada
        alert("Você já denunciou este post. Nossa equipe irá analisar.");
      } else {
        alert("Erro ao denunciar: " + error.message);
      }
      return;
    }

    alert("Denúncia enviada! Obrigado por ajudar a manter a comunidade segura.");
  };

  const handleCompartilhar = (postId: string) => {
    const url = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado para compartilhar!');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  if (feedBloqueado) {
    return (
      <TelaBloqueio 
        titulo="Feed em Manutenção"
        descricao="Estamos organizando a comunidade do AniVerse para você. O Feed será liberado em breve!"
        spoiler={
          <div className="text-sm text-text">
            <p>Em breve você poderá:</p>
            <ul className="list-disc list-inside text-left mt-2 space-y-1 text-muted">
              <li>Compartilhar seu Top 10 com a comunidade.</li>
              <li>Interagir com outros fãs no Feed.</li>
              <li>Concorrer ao título de "Top Criador".</li>
            </ul>
          </div>
        }
      />
    );
  }

  return (
    <div className="w-full max-w-[90rem] mx-auto py-8 px-4 lg:px-8">
      
      {imagemAberta && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setImagemAberta(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-red-400 transition-colors cursor-pointer z-10" onClick={() => setImagemAberta(null)}><X size={32} /></button>
          <div className="w-full max-w-md bg-surface rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <CarrosselImagens imagens={getImagensOrdenadas(imagemAberta)} isRanking={imagemAberta.is_ranking} />
          </div>
        </div>
      )}

      {postComentariosAberto && (
        <ModalComentarios post={postComentariosAberto} onClose={() => setPostComentariosAberto(null)} />
      )}

      {criadorAberto && (
        <CriadorPost onClose={() => setCriadorAberto(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 xl:gap-16 items-start">
        
        <div className="hidden lg:block lg:col-span-3 sticky top-24">
          <TrendingAnimes />
        </div>

        <div className="lg:col-span-6 w-full max-w-lg mx-auto justify-self-center">
          
          <BannerGlobal />

          {/* ====== REGRAS DA COMUNIDADE (COMPACTO) ====== */}
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="text-accent shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-muted">
              <p className="font-bold text-text mb-1">Regras da Comunidade</p>
              <p>
                Mantenha o respeito (sem ofensas ou preconceito). Não faça spam repetindo o mesmo conteúdo. 
                Lembre-se: <strong className="text-text">você não pode curtir, comentar ou votar na própria enquete.</strong> Curtidas valem 1 pt, comentários 2 pts e votos 1 pt.
              </p>
            </div>
          </div>
          {/* ========================================= */}

          <div className="flex items-center justify-between mb-6 w-full">
            <div className="flex items-center gap-3">
              <Sparkles className="text-accent" size={32} />
              <h1 className="text-3xl font-bold text-text">Feed</h1>
            </div>
            <button 
              onClick={() => setCriadorAberto(true)}
              className="bg-accent text-white p-2 rounded-lg hover:bg-accent/90 transition-colors cursor-pointer shadow-lg shadow-accent/20"
              title="Criar novo post"
            >
              <PlusCircle size={24} />
            </button>
          </div>

          <div className="mb-6">
            <EspacoAnuncio formato="banner" />
          </div>

          <div className="block lg:hidden mb-6">
            <TopCriadores />
          </div>

          {optimisticLikes.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
              <p className="text-muted mb-4">O Feed está vazio. Seja o primeiro a postar!</p>
              <Link href="/top10" className="bg-accent text-white font-bold px-6 py-3 rounded-lg hover:bg-accent/90 transition-all">
                Criar meu Top 10
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {optimisticLikes.map((post) => (
                <div 
                  key={post.id} 
                  className={`bg-surface border rounded-xl overflow-hidden shadow-sm transition-colors w-full ${
                    post.user_id === topMensalUserId 
                      ? 'border-yellow-500 ring-2 ring-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                      : 'border-border hover:border-accent'
                  }`}
                >

                  <div className="flex items-center gap-3 p-3">
                    <Link href={`/perfil/${post.profiles?.username}`} className="relative w-8 h-8 rounded-full overflow-hidden bg-border shrink-0 hover:ring-2 hover:ring-accent transition-all">
                      {post.profiles?.avatar_url ? (
                        <Image src={post.profiles.avatar_url} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold">{post.profiles?.username?.charAt(0).toUpperCase() || '?'}</div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Link 
                          href={`/perfil/${post.profiles?.username}`} 
                          className="text-sm font-bold text-text hover:text-accent hover:underline transition-colors"
                        >
                          {post.profiles?.username || 'Usuário'}
                        </Link>
                        
                        {/* SELO DE ADMIN (só aparece se não for o seu próprio post) */}
                        {post.profiles?.is_admin && post.user_id !== currentUserId && <SeloAdmin />}
                        
                        {/* SELO DE TOP MENSAL (só aparece se não for o seu próprio post) */}
                        {post.user_id === topMensalUserId && post.user_id !== currentUserId && (
                          <div className="bg-yellow-500/20 text-yellow-500 p-1 rounded-full border border-yellow-500/50" title="Top Criador do Mês">
                            <Trophy size={14} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {post.user_id !== currentUserId && (
                        <button 
                          onClick={() => handleDenunciar(post)}
                          className="text-muted hover:text-yellow-500 transition-colors p-1 cursor-pointer"
                          title="Denunciar post"
                        >
                          <Flag size={18} />
                        </button>
                      )}

                      <button 
                        onClick={() => handleCompartilhar(post.id)}
                        className="text-muted hover:text-accent transition-colors p-1 cursor-pointer"
                        title="Compartilhar post"
                      >
                        <Share2 size={18} />
                      </button>

                      {(post.user_id === currentUserId || isAdmin) && (
                        <button 
                          onClick={() => handleDeletar(post)}
                          className="text-muted hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="Deletar post"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {post.is_poll ? (
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-2 mb-3 text-accent">
                        <BarChart2 size={20} />
                        <span className="font-bold text-sm">Enquete</span>
                      </div>
                      <div className="space-y-3">
                        {(
                          typeof post.poll_options === 'string' 
                            ? JSON.parse(post.poll_options) 
                            : post.poll_options
                        )?.map((opcao: string, index: number) => {
                          const votosNaOpcao = post.votes.find(v => v.option_index === index)?.count || 0;
                          const totalVotos = post.votes.reduce((acc, v) => acc + v.count, 0);
                          const porcentagem = totalVotos > 0 ? Math.round((votosNaOpcao / totalVotos) * 100) : 0;
                          const meuVoto = post.user_vote_index === index;
                          const isDono = post.user_id === currentUserId;

                          return (
                            <button
                              key={index}
                              onClick={() => {
                                if (post.user_vote_index !== null || votando || isDono) return;
                                handleVotar(post.id, index);
                              }}
                              disabled={post.user_vote_index !== null || votando || isDono}
                              className={`relative w-full text-left p-3 rounded-lg border transition-all overflow-hidden ${
                                meuVoto 
                                  ? 'border-accent bg-accent/10' 
                                  : 'border-border bg-bg'
                              } ${
                                (post.user_vote_index !== null || isDono) 
                                  ? 'cursor-default' 
                                  : 'cursor-pointer hover:border-accent/50'
                              }`}
                            >
                              {(post.user_vote_index !== null || isDono) && (
                                <div 
                                  className="absolute inset-y-0 left-0 bg-accent/20 transition-all duration-500" 
                                  style={{ width: `${porcentagem}%` }}
                                />
                              )}
                              <div className="relative flex items-center justify-between z-10">
                                <span className={`text-sm font-medium ${meuVoto ? 'text-accent' : 'text-text'}`}>
                                  {opcao}
                                </span>
                                {(post.user_vote_index !== null || isDono) && (
                                  <span className={`text-sm font-bold ${meuVoto ? 'text-accent' : 'text-muted'}`}>
                                    {porcentagem}%
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted mt-2 flex items-center justify-between">
                        <span>{post.votes.reduce((acc, v) => acc + v.count, 0)} votos</span>
                        {post.user_id === currentUserId && (
                          <span className="text-yellow-500">(Você não pode votar na própria enquete)</span>
                        )}
                      </p>
                    </div>
                  ) : getImagensOrdenadas(post).length > 0 ? (
                    <div className="cursor-pointer relative max-h-[500px] overflow-hidden bg-black/5 flex items-center justify-center" onClick={() => setImagemAberta(post)}>
                      <CarrosselImagens imagens={getImagensOrdenadas(post)} isRanking={post.is_ranking} />
                      {post.has_spoiler && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 z-10">
                          <AlertTriangle size={12} /> Spoiler
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-2">
                      <p className="text-text text-lg whitespace-pre-wrap">{post.caption}</p>
                    </div>
                  )}

                  <div className="p-3">
                    {post.caption && (getImagensOrdenadas(post).length > 0 || post.is_poll) && (
                      <p className="text-sm text-text mb-3 line-clamp-2">{post.caption}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-muted text-sm">
                      {post.user_id !== currentUserId ? (
                        <>
                          <button 
                            onClick={() => handleLike(post)} 
                            disabled={curtindo === post.id}
                            className={`flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${post.user_has_liked ? 'text-red-500' : 'hover:text-red-500'}`}
                          >
                            <Heart size={18} fill={post.user_has_liked ? "currentColor" : "none"} /> {post.likes_count}
                          </button>
                          <button onClick={() => setPostComentariosAberto(post)} className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                            <MessageCircle size={18} /> {post.comments_count}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 opacity-50" title="Você não pode curtir seu próprio post">
                            <Heart size={18} /> {post.likes_count}
                          </div>
                          <div className="flex items-center gap-1 opacity-50" title="Você não pode comentar no seu próprio post">
                            <MessageCircle size={18} /> {post.comments_count}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 w-full max-w-md mx-auto lg:mx-0 lg:sticky lg:top-24">
          <TopCriadores />
          <div className="mt-6">
            <EspacoAnuncio formato="vertical" />
          </div>
        </div>
        
      </div>
    </div>
  );
}