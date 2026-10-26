'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Send, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Post { id: string; }

export function ModalComentarios({ post, onClose }: { post: Post, onClose: () => void }) {
  const supabase = createClient();
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);

  useEffect(() => {
    const fetchComentarios = async () => {
      const { data } = await supabase
        .from('post_comments')
        .select(`id, content, created_at, profiles (username, avatar_url)`)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (data) setComentarios(data);
      setCarregandoInicial(false);
    };
    fetchComentarios();
  }, [post.id]);

  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Faça login para comentar.'); return; }

    const { data, error } = await supabase.from('post_comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: novoComentario
    }).select(`id, content, created_at, profiles (username, avatar_url)`).single();

    if (!error && data) {
      setComentarios([...comentarios, data]);
      setNovoComentario('');
    } else {
      alert('Erro ao comentar.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface rounded-xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text">Comentários</h2>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={24} /></button>
        </div>

        {/* Lista de Comentários */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {carregandoInicial ? (
            <div className="flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
          ) : comentarios.length === 0 ? (
            <p className="text-center text-muted text-sm py-8">Nenhum comentário ainda. Seja o primeiro!</p>
          ) : (
            comentarios.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-border shrink-0">
                  {c.profiles?.avatar_url ? (
                    <Image src={c.profiles.avatar_url} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">{c.profiles?.username?.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-text">{c.profiles?.username}</p>
                  <p className="text-sm text-muted">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleEnviarComentario} className="p-3 border-t border-border flex gap-2">
          <input 
            type="text" 
            value={novoComentario}
            onChange={e => setNovoComentario(e.target.value)}
            placeholder="Adicione um comentário..."
            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-accent"
          />
          <button 
            type="submit" 
            disabled={loading || !novoComentario.trim()}
            className="bg-accent text-white p-2 rounded-lg disabled:opacity-50 hover:bg-accent/90 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}