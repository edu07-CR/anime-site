'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send, Lock, Trash2, Clock, Flag, AlertTriangle } from 'lucide-react';
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
  const [denunciando, setDenunciando] = useState(false);
  
  // NOVO: Guarda o perfil do usuário logado para usar na UI Otimista
  const [meuPerfil, setMeuPerfil] = useState<{ username: string; avatar_url: string; is_admin: boolean } | null>(null);
  
  // Estado para controlar o modal de deleção
  const [mensagemParaDeletar, setMensagemParaDeletar] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const isDev = process.env.NODE_ENV === 'development';

      if (!isDev) {
        const { data: config } = await supabase.from('site_config').select('chat_enabled').single();
        if (config?.chat_enabled === false) {
          setBloqueado(true);
          setLoading(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Busca o perfil completo (username, avatar, is_admin) para usar no Otimista
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, is_admin')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setIsAdmin(profile.is_admin);
          setMeuPerfil(profile);
        }
      }

      const { data } = await supabase
        .from('chat_messages')
        .select(`id, content, created_at, user_id, profiles (username, avatar_url, is_admin)`)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) setMensagens(data as unknown as Mensagem[]);
      setLoading(false);
    };

    init();

    const channel = supabase
      .channel(`chat-comunidade-${Date.now()}`)
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
            
          if (data) {
            setMensagens((prev) => {
              // Remove a mensagem temporária (se existir) para não duplicar
              const semTemporarias = prev.filter((msg) => !msg.id.startsWith('temp-'));
              return [...semTemporarias, data as unknown as Mensagem];
            });
          }
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
    if (!novaMensagem.trim() || !userId || bloqueado || !meuPerfil) return;

    const msgText = novaMensagem;
    setNovaMensagem(''); // Limpa o input na hora

    // 1. CRIA UMA MENSAGEM FALSA (OTIMISTA) NA TELA
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Mensagem = {
      id: tempId,
      content: msgText,
      created_at: new Date().toISOString(),
      user_id: userId,
      profiles: meuPerfil,
    };

    setMensagens((prev) => [...prev, optimisticMsg]);

    try {
      // 2. VERIFICA O RATE LIMIT
      const rateRes = await fetch('/api/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const rateData = await rateRes.json();

      if (!rateData.success) {
        const segundosRestantes = Math.ceil((rateData.reset - Date.now()) / 1000);
        alert(`Muito rápido! Aguarde ${segundosRestantes} segundos.`);
        
        // Remove a mensagem otimista e devolve o texto
        setMensagens((prev) => prev.filter((msg) => msg.id !== tempId)); 
        setNovaMensagem(msgText); 
        return;
      }

      // 3. SALVA NO SUPABASE
      const { error } = await supabase.from('chat_messages').insert({ 
        user_id: userId, 
        content: msgText 
      });

      if (error) {
        alert('Erro ao enviar a mensagem.');
        setMensagens((prev) => prev.filter((msg) => msg.id !== tempId));
        setNovaMensagem(msgText);
      }
      
    } catch (err) {
      console.error(err);
      setMensagens((prev) => prev.filter((msg) => msg.id !== tempId));
      setNovaMensagem(msgText);
    }
  };

  const handleDeletarMensagem = (id: string) => {
    setMensagemParaDeletar(id);
  };

  const confirmarDelecao = async () => {
    if (!mensagemParaDeletar) return;
    
    const id = mensagemParaDeletar;
    setMensagemParaDeletar(null);

    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    if (error) alert('Erro ao apagar a mensagem.');
    else setMensagens((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleDenunciar = async (msg: Mensagem) => {
    if (!userId) return;
    if (!confirm(`Deseja denunciar a mensagem de ${msg.profiles.username}?`)) return;

    setDenunciando(true);
    try {
      const { error } = await supabase.from('feedbacks').insert({
        user_id: userId,
        type: 'denuncia',
        message: `Denúncia de mensagem no chat: "${msg.content}" (Autor: ${msg.profiles.username} | ID da msg: ${msg.id})`
      });

      if (error) throw error;
      alert('Denúncia enviada! Nossa equipe irá analisar.');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar a denúncia.');
    } finally {
      setDenunciando(false);
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
    <div className="flex flex-col h-[60vh] bg-bg/20 rounded-b-2xl relative">
      
      <div className="p-2 border-b border-border bg-surface/50 flex items-center justify-center gap-2 text-muted text-[10px]">
        <Clock size={12} />
        <span>As mensagens são apagadas automaticamente a cada 24h.</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map((msg) => {
          const isMe = msg.user_id === userId;
          const podeDeletar = isMe || isAdmin;
          const isTemporaria = msg.id.startsWith('temp-');

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
                  {podeDeletar && !isTemporaria && (
                    <button 
                      onClick={() => handleDeletarMensagem(msg.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-500 ${isMe ? 'order-first' : 'order-last'}`}
                      title="Apagar mensagem"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {!isMe && !isAdmin && !isTemporaria && (
                    <button 
                      onClick={() => handleDenunciar(msg)}
                      disabled={denunciando}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-yellow-500 ${isMe ? 'order-first' : 'order-last'}`}
                      title="Denunciar mensagem"
                    >
                      <Flag size={14} />
                    </button>
                  )}
                  
                  <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-accent text-white rounded-tr-sm' : 'bg-surface text-text rounded-tl-sm border border-border'} ${isTemporaria ? 'opacity-60' : ''}`}>
                    {msg.content}
                  </div>
                </div>

                <span className="text-[10px] text-muted mt-1 px-1">
                  {isTemporaria ? 'Enviando...' : formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
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

      {/* MODAL DE CONFIRMAÇÃO DE DELEÇÃO */}
      {mensagemParaDeletar && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-b-2xl">
          <div className="bg-surface border border-border p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="p-2 bg-red-500/10 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-text">Apagar mensagem</h3>
            </div>
            
            <p className="text-muted text-sm mb-6">
              Tem certeza que deseja apagar esta mensagem? Essa ação não pode ser desfeita.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setMensagemParaDeletar(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-muted hover:bg-border transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarDelecao}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}