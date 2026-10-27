'use client';

import { useState, useEffect, useOptimistic, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Sparkles, Heart, MessageCircle, AlertTriangle, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CarrosselImagens } from '@/components/feed/CarrosselImagens';
import { ModalComentarios } from '@/components/feed/ModalComentarios';
import { toggleLike } from '@/app/actions/feed';
import { SeloAdmin } from '@/components/layout/SeloAdmin';

const supabase = createClient();

interface Post {
  id: string;
  media_url: string | null;
  media_urls: string[] | null;
  media_type: string;
  caption: string | null;
  has_spoiler: boolean;
  created_at: string;
  profiles: { username: string; avatar_url: string; is_admin: boolean } | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedBloqueado, setFeedBloqueado] = useState(false);
  const [imagemAberta, setImagemAberta] = useState<Post | null>(null);
  const [postComentariosAberto, setPostComentariosAberto] = useState<Post | null>(null);

  const getImagensOrdenadas = (post: Post) => {
    if (!post.media_urls || post.media_urls.length === 0) {
      return post.media_url ? [post.media_url] : [];
    }
    if (post.media_urls.length > 1) {
      const capas = post.media_urls.slice(0, -1); 
      return capas.reverse(); 
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
      const { data: config } = await supabase.from('site_config').select('feed_enabled').single();
      if (config?.feed_enabled === false) {
        setFeedBloqueado(true);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id, media_url, media_urls, media_type, caption, has_spoiler, created_at,
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
  }, []);

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

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  if (feedBloqueado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="bg-surface border border-border p-6 rounded-full mb-6">
          <AlertTriangle size={48} className="text-muted" />
        </div>
        <h2 className="text-3xl font-bold text-text mb-4">Feed em Manutenção</h2>
        <p className="text-muted max-w-md mx-auto mb-8">Estamos organizando a comunidade do AniVerse para você. O Feed será liberado em breve!</p>
        <Link href="/lancamentos" className="bg-accent text-white font-bold px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
          Voltar para os Lançamentos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      
      {imagemAberta && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setImagemAberta(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-red-400 transition-colors cursor-pointer z-10" onClick={() => setImagemAberta(null)}><X size={32} /></button>
          <div className="w-full max-w-md bg-surface rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <CarrosselImagens imagens={getImagensOrdenadas(imagemAberta)} />
          </div>
        </div>
      )}

      {postComentariosAberto && (
        <ModalComentarios post={postComentariosAberto} onClose={() => setPostComentariosAberto(null)} />
      )}

      <div className="flex items-center gap-3 mb-8 max-w-md mx-auto w-full">
        <Sparkles className="text-accent" size={32} />
        <h1 className="text-3xl font-bold text-text">Feed da Comunidade</h1>
      </div>

      {optimisticLikes.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl max-w-md mx-auto">
          <p className="text-muted mb-4">O Feed está vazio. Seja o primeiro a postar o seu Top 5!</p>
          <Link href="/top10" className="bg-accent text-white font-bold px-6 py-3 rounded-lg hover:bg-accent/90 transition-all">
            Criar meu Top 5
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-md mx-auto">
          {optimisticLikes.map((post) => (
            <div key={post.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm hover:border-accent transition-colors w-full">

              {/* Header do Post */}
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
                    {/* Link para o perfil público */}
                    <Link 
                      href={`/perfil/${post.profiles?.username}`} 
                      className="text-sm font-bold text-text hover:text-accent hover:underline transition-colors"
                    >
                      {post.profiles?.username || 'Usuário'}
                    </Link>
                    {post.profiles?.is_admin && <SeloAdmin />}
                  </div>
                </div>
              </div>

              {/* Mídia (Carrossel) */}
              <div className="cursor-pointer relative" onClick={() => setImagemAberta(post)}>
                <CarrosselImagens imagens={getImagensOrdenadas(post)} />
                {post.has_spoiler && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 z-10">
                    <AlertTriangle size={12} /> Spoiler
                  </div>
                )}
              </div>

              {/* Legenda e Ações */}
              <div className="p-3">
                {post.caption && <p className="text-sm text-text mb-3 line-clamp-2">{post.caption}</p>}
                
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
  );
}