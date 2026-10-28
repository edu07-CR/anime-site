'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send, Lock, Trash2, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SeloAdmin } from '@/components/layout/SeloAdmin';

interface Mensagem {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
    is_admin: boolean;
  };
}

export function ChatComunidade() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      // 1. Verifica bloqueio
      const { data: config } = await supabase.from('site_config').select('chat_enabled').single();
      if (config?.chat_enabled === false) {
        setBloqueado(true);
        setLoading(false);
        return;
      }

      // 2. Pega usuário e verifica se é admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (profile?.is_admin) setIsAdmin(true);
      }

      // 3. Busca mensagens
      const { data } = await supabase
        .from('chat_messages')
        .select(`id, content, created_at, user_id, profiles (username, avatar_url, is_admin)`)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) setMensagens(data as unknown as Mensagem[]);
      setLoading(false);
    };

    init();

    // Realtime
    const channel = supabase
      .channel('chat-geral')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          if (bloqueado) return;

          const { data } = await supabase
            .from('chat_messages')
            .select(`id, content, created_at, user_id, profiles (username, avatar_url, is_admin)`)
            .eq('id', payload.new.id)
            .single();
            
          if (data) setMensagens((prev) => [...prev, data as unknown as Mensagem]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, bloqueado]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !userId || bloqueado) return;

    const msg = novaMensagem;
    setNovaMensagem('');

    await supabase.from('chat_messages').insert({ user_id: userId, content: msg });
  };

  // FUNÇÃO PARA DELETAR UMA MENSAGEM ESPECÍFICA
  const handleDeletarMensagem = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar esta mensagem?')) return;

    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    
    if (error) {
      alert('Erro ao apagar a mensagem.');
    } else {
      // Remove da tela na hora
      setMensagens((prev) => prev.filter((msg) => msg.id !== id));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={32} /></div>;
  }

  if (bloqueado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-bg/20">
        <div className="bg-surface border border-border p-6 rounded-full mb-6">
          <Lock className="text-muted" size={48} />
        </div>
        <h3 className="text-2xl font-bold text-text mb-4">Chat em Manutenção</h3>
        <p className="text-muted max-w-md mx-auto mb-8">
          Estamos preparando a comunidade do AniVerse para você. O chat será liberado em breve!
        </p>
        <Link href="/" className="bg-accent text-white font-bold px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
          Voltar para os Lançamentos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh] bg-bg/20 rounded-b-2xl">
      
      {/* AVISO DE LIMPEZA AUTOMÁTICA */}
      <div className="p-2 border-b border-border bg-surface/50 flex items-center justify-center gap-2 text-muted text-[10px]">
        <Clock size={12} />
        <span>As mensagens são apagadas automaticamente a cada 24h.</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map((msg) => {
          const isMe = msg.user_id === userId;
          // Pode deletar se for a própria mensagem OU se for admin
          const podeDeletar = isMe || isAdmin;

          return (
            <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-border shrink-0">
                {msg.profiles?.avatar_url ? (
                  <Image src={msg.profiles.avatar_url} alt="Avatar" fill sizes="32px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold">{msg.profiles?.username?.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-muted">{msg.profiles?.username}</span>
                  {msg.profiles?.is_admin && <SeloAdmin />}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* BOTÃO DE LIXEIRA (Aparece no hover) */}
                  {podeDeletar && (
                    <button 
                      onClick={() => handleDeletarMensagem(msg.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-500 ${isMe ? 'order-first' : 'order-last'}`}
                      title="Apagar mensagem"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  
                  <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-accent text-white rounded-tr-sm' : 'bg-surface text-text rounded-tl-sm border border-border'}`}>
                    {msg.content}
                  </div>
                </div>

                <span className="text-[10px] text-muted mt-1 px-1">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleEnviar} className="p-3 border-t border-border bg-surface flex gap-2 rounded-b-2xl">
        <input
          type="text"
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Digite no chat da comunidade..."
          disabled={bloqueado}
          className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!novaMensagem.trim() || bloqueado} 
          className="bg-accent text-white p-3 rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors cursor-pointer"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}