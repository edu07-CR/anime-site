'use client';

import { useState, useEffect, useOptimistic, startTransition } from 'react';
import { useRouter } from 'next/navigation'; // <-- IMPORT DO ROUTER
import { createClient } from '@/lib/supabase/client';
import { Loader2, Sparkles, Heart, MessageCircle, AlertTriangle, X, Trash2, Lock, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CarrosselImagens } from '@/components/feed/CarrosselImagens';
import { ModalComentarios } from '@/components/feed/ModalComentarios';
import { toggleLike } from '@/app/actions/feed';
import { deletarPost } from '@/app/actions/posts';
import { SeloAdmin } from '@/components/layout/SeloAdmin';
import { TopCriadores } from '@/components/feed/TopCriadores';
import { CriadorPost } from '@/components/feed/CriadorPost';

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
  profiles: { username: string; avatar_url: string; is_admin: boolean } | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export default function FeedPage() {
  const router = useRouter(); // <-- INICIALIZA O ROUTER
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedBloqueado, setFeedBloqueado] = useState(false);
  const [imagemAberta, setImagemAberta] = useState<Post | null>(null);
  const [postComentariosAberto, setPostComentariosAberto] = useState<Post | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [criadorAberto, setCriadorAberto] = useState(false);

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
      // 1. VERIFICA SE ESTÁ LOGADO
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. Verifica se o feed está bloqueado
      const { data: config } = await supabase.from('site_config').select('feed_enabled').single();
      if (config?.feed_enabled === false) {
        setFeedBloqueado(true);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (profile?.is_admin) setIsAdmin(true);

      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id, user_id, media_url, media_urls, media_type, caption, has_spoiler, created_at, is_ranking,
          profiles (username, avatar_url, is_admin)
        `)
        .order('created_at', { ascending: false });

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

            return {
              ...post,
              likes_count: likes || 0,
              comments_count: comments || 0,
              user_has_liked
            };
          })
        );
        setPosts(postsComContagem as unknown as Post[]);
      }
      setLoading(false);
    };

    checkAndFetch();
  }, [supabase, router]); // <-- ADICIONA ROUTER NAS DEPENDÊNCIAS

  const handleLike = (post: Post) => {
    startTransition(async () => {
      addOptimisticLike({ postId: post.id, isLiked: post.user_has_liked });
      await toggleLike(post.id, post.user_has_liked);
      setPosts((prev) => 
        prev.map((p) => 
          p.id === post.id 
            ? { ...p, user_has_liked: !post.user_has_liked, likes_count: post.user_has_liked ? p.likes_count - 1 : p.likes_count + 1 } 
            : p
        )
      );
    });
  };

  const handleDeletar = async (post: Post) => {
    if (!confirm('Tem certeza que deseja deletar este post?')) return;

    try {
      await deletarPost(post.id, post.media_urls || []);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar o post.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  if (feedBloqueado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="bg-surface border border-border p-6 rounded-full mb-6">
          <Lock size={48} className="text-muted" />
        </div>
        <h2 className="text-3xl font-bold text-text mb-4">Feed em Manutenção</h2>
        <p className="text-muted max-w-md mx-auto mb-8">Estamos organizando a comunidade do AniVerse para você. O Feed será liberado em breve!</p>
        <Link href="/" className="bg-accent text-white font-bold px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
          Voltar para os Lançamentos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="hidden lg:block lg:col-span-2"></div>

        <div className="lg:col-span-6 w-full max-w-md mx-auto lg:mx-0">
          
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
                <div key={post.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm hover:border-accent transition-colors w-full">

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
                        {post.profiles?.is_admin && <SeloAdmin />}
                      </div>
                    </div>

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

                  {getImagensOrdenadas(post).length > 0 ? (
                    <div className="cursor-pointer relative" onClick={() => setImagemAberta(post)}>
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
                    {post.caption && getImagensOrdenadas(post).length > 0 && <p className="text-sm text-text mb-3 line-clamp-2">{post.caption}</p>}
                    
                    <div className="flex items-center gap-4 text-muted text-sm">
                      <button onClick={() => handleLike(post)} className={`flex items-center gap-1 transition-colors cursor-pointer ${post.user_has_liked ? 'text-red-500' : 'hover:text-red-500'}`}>
                        <Heart size={18} fill={post.user_has_liked ? "currentColor" : "none"} /> {post.likes_count}
                      </button>
                      <button onClick={() => setPostComentariosAberto(post)} className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                        <MessageCircle size={18} /> {post.comments_count}
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 w-full max-w-md mx-auto lg:mx-0 lg:sticky lg:top-24">
          <TopCriadores />
        </div>
        
      </div>
    </div>
  );
}