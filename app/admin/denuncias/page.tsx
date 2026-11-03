'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Trash2, EyeOff, ExternalLink, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface Denuncia {
  id: string;
  post_id: string;
  reporter_username: string;
  reason: string;
  created_at: string;
  post_caption: string | null;
  post_user_username: string;
}

export default function AdminDenuncias() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchDenuncias = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_denuncias_posts');
    if (data) setDenuncias(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDenuncias();
  }, []);

  const handleDeletarPost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja deletar o post denunciado?')) return;

    // Deleta o post (isso vai deletar as denúncias em cascata)
    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      alert('Erro ao deletar: ' + error.message);
    } else {
      alert('Post deletado com sucesso.');
      fetchDenuncias(); // Atualiza a lista
    }
  };

  const handleIgnorar = async (denunciaId: string) => {
    if (!confirm('Deseja ignorar esta denúncia?')) return;

    const { error } = await supabase.from('post_reports').delete().eq('id', denunciaId);

    if (error) {
      alert('Erro ao ignorar: ' + error.message);
    } else {
      fetchDenuncias();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={32} /></div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="text-red-500" size={32} />
        <h1 className="text-2xl font-bold text-text">Denúncias de Posts</h1>
      </div>

      {denuncias.length === 0 ? (
        <div className="text-center py-10 bg-surface border border-border rounded-2xl">
          <p className="text-muted">Nenhuma denúncia pendente. A comunidade está limpa! 🎉</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {denuncias.map((denuncia) => (
            <div key={denuncia.id} className="bg-surface border border-border p-4 rounded-xl flex flex-col gap-3">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-red-500">Denúncia:</span>
                  <span className="text-text">{denuncia.reason}</span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(denuncia.created_at).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="text-sm text-muted">
                <p>Denunciado por: <strong className="text-text">@{denuncia.reporter_username}</strong></p>
                <p>Autor do post: <strong className="text-text">@{denuncia.post_user_username}</strong></p>
                <p>Conteúdo: <span className="italic">"{denuncia.post_caption || '(Sem texto)'}"</span></p>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Link 
                  href={`/feed/${denuncia.post_id}`}
                  target="_blank"
                  className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                >
                  <ExternalLink size={14} /> Ver Post
                </Link>
                
                <button 
                  onClick={() => handleIgnorar(denuncia.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-bg border border-border text-text rounded-lg hover:bg-surface text-sm"
                >
                  <EyeOff size={14} /> Ignorar
                </button>

                <button 
                  onClick={() => handleDeletarPost(denuncia.post_id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  <Trash2 size={14} /> Deletar Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}