'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Trash2, Eye, EyeOff } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  has_spoiler: boolean;
  created_at: string;
  user_id: string;
  profiles: { username: string };
}

export function SecaoComentarios({ animeId }: { animeId: number }) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para mostrar/ocultar spoiler individualmente
  const [spoilersAbertos, setSpoilersAbertos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();

    // Buscar comentários
    const fetchComments = async () => {
      const res = await fetch(`/api/comments?animeId=${animeId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
      setLoading(false);
    };
    fetchComments();
  }, [animeId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        anime_id: animeId,
        content: newComment.trim(),
        has_spoiler: isSpoiler
      });

    if (!error) {
      setNewComment('');
      setIsSpoiler(false);
      
      // Recarrega os comentários
      const res = await fetch(`/api/comments?animeId=${animeId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } else {
      alert("Erro ao enviar comentário. Tente novamente.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este comentário?")) return;

    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setComments(comments.filter(c => c.id !== id));
    } else {
      alert("Erro ao apagar comentário.");
    }
  };

  const toggleSpoiler = (id: string) => {
    setSpoilersAbertos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mt-12 bg-surface/50 border border-border rounded-xl p-6 md:p-8">
      <h2 className="text-2xl font-bold text-text mb-6">Discussão</h2>

      {/* FORMULÁRIO DE NOVO COMENTÁRIO */}
      {userId ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="O que você achou deste anime/episódio?"
            rows={3}
            className="w-full bg-bg border border-border text-text rounded-lg p-4 focus:outline-none focus:border-accent resize-none mb-3"
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted hover:text-text transition-colors">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg cursor-pointer"
              />
              Este comentário contém spoiler
            </label>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="flex items-center gap-2 bg-accent text-white px-6 py-2 rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Comentar
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-bg border border-border rounded-lg p-4 text-center mb-8">
          <p className="text-muted text-sm">Faça login para participar da discussão.</p>
        </div>
      )}

      {/* LISTA DE COMENTÁRIOS */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-accent" /></div>
      ) : comments.length === 0 ? (
        <p className="text-muted text-center py-8">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => {
            const isSpoilerAberto = spoilersAbertos[comment.id];

            return (
              <div key={comment.id} className="bg-bg border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent text-sm">
                      {comment.profiles?.username || 'Usuário'}
                    </span>
                    <span className="text-muted text-xs">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {userId === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-muted hover:text-red-400 transition-colors cursor-pointer"
                      title="Apagar comentário"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* CONTEÚDO COM BLUR ANTI-SPOILER */}
                <div className="relative">
                  <p className={`text-text text-sm leading-relaxed ${comment.has_spoiler && !isSpoilerAberto ? 'blur-sm select-none' : ''}`}>
                    {comment.content}
                  </p>
                  
                  {comment.has_spoiler && !isSpoilerAberto && (
                    <button
                      onClick={() => toggleSpoiler(comment.id)}
                      className="absolute inset-0 w-full h-full flex items-center justify-center gap-2 text-accent font-bold text-sm bg-bg/50 rounded cursor-pointer"
                    >
                      <Eye size={16} /> Mostrar Spoiler
                    </button>
                  )}
                  {comment.has_spoiler && isSpoilerAberto && (
                    <button
                      onClick={() => toggleSpoiler(comment.id)}
                      className="mt-2 text-xs text-muted hover:text-accent flex items-center gap-1 cursor-pointer"
                    >
                      <EyeOff size={14} /> Ocultar Spoiler
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}