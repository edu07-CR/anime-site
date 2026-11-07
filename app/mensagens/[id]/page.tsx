'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send, ArrowLeft, Trash2, ShieldBan, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SeloAdmin } from '@/components/layout/SeloAdmin';
import { TelaBloqueio } from '@/components/layout/TelaBloqueio';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  is_admin: boolean;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

export default function MensagensPage() {
  const params = useParams();
  const targetUserId = params.id as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatBloqueado, setChatBloqueado] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  
  const [mensagemParaDeletar, setMensagemParaDeletar] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let channel: any = null;

    const init = async () => {
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev) {
        const { data: config } = await supabase.from('site_config').select('chat_enabled').single();
        if (config?.chat_enabled === false) {
          setChatBloqueado(true);
          setLoading(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setMyUserId(user.id);

      const { data: myProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (myProfile?.is_admin) setIsAdmin(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_admin')
        .eq('id', targetUserId)
        .single();
      if (profile) setTargetProfile(profile);

      const { data: blockData } = await supabase
        .from('blocks')
        .select('id')
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`)
        .maybeSingle();

      if (blockData) {
        setIsBlocked(true);
        setLoading(false);
        return;
      }

      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs);
      
      await supabase.from('direct_messages').update({ is_read: true }).eq('sender_id', targetUserId).eq('receiver_id', user.id).eq('is_read', false);
      
      setLoading(false);

      const channelName = `chat-privado-${targetUserId}-${Date.now()}`;
      channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload: any) => {
          if (isBlocked) return;

          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === myUserId && (newMsg as any).receiver_id === targetUserId) ||
            (newMsg.sender_id === targetUserId && (newMsg as any).receiver_id === myUserId)
          ) {
            setMessages((prev) => {
              // Remove a mensagem temporária (se existir) para não duplicar
              const semTemporarias = prev.filter(m => !m.id.startsWith('temp-'));
              return [...semTemporarias, newMsg];
            });
          }
        }
      );

      channel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'direct_messages' },
        (payload: any) => {
          const deletedId = payload.old.id;
          if (deletedId) {
            setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
          }
        }
      );

      channel.subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, router, targetUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !myUserId || chatBloqueado || isBlocked) return;

    const msgText = newMessage;
    setNewMessage(''); // Limpa o input na hora

    // 1. CRIA UMA MENSAGEM FALSA (OTIMISTA) NA TELA
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: msgText,
      created_at: new Date().toISOString(),
      sender_id: myUserId,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // 2. VERIFICA O RATE LIMIT EM BACKGROUND
    try {
      const rateRes = await fetch('/api/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: myUserId })
      });
      
      const rateData = await rateRes.json();

      if (!rateData.success) {
        const segundosRestantes = Math.ceil((rateData.reset - Date.now()) / 1000);
        alert(`Muito rápido! Aguarde ${segundosRestantes} segundos.`);
        
        // Remove a mensagem otimista pois falhou
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId)); 
        setNewMessage(msgText); // Devolve o texto pro input
        return;
      }

      // 3. SALVA NO SUPABASE
      const { error } = await supabase.from('direct_messages').insert({
        sender_id: myUserId,
        receiver_id: targetUserId,
        content: msgText
      });

      if (error) {
        alert('Não foi possível enviar. Você pode ter sido bloqueado.');
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setNewMessage(msgText);
      } 
      // Se der certo, o Realtime vai trazer a mensagem real e o filtro vai remover a temporária.
      
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(msgText);
    }
  };

  const handleDeletarMensagem = (id: string) => {
    setMensagemParaDeletar(id);
  };

  const confirmarDelecao = async () => {
    if (!mensagemParaDeletar) return;

    const id = mensagemParaDeletar;
    setMensagemParaDeletar(null);

    const { data, error } = await supabase
      .from('direct_messages')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      alert('Erro ao apagar a mensagem: ' + error.message);
    } else if (!data || data.length === 0) {
      alert('Você não tem permissão para apagar esta mensagem. Verifique as políticas do banco.');
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  if (chatBloqueado) {
    return (
      <TelaBloqueio 
        titulo="Chat em Manutenção"
        descricao="Estamos preparando a comunidade do AniVerse para você. As mensagens serão liberadas em breve!"
        spoiler={
          <p className="text-sm text-muted text-left">
            Em breve você poderá enviar mensagens privadas, criar grupos e compartilhar seus animes favoritos!
          </p>
        }
      />
    );
  }

  if (isBlocked) {
    return (
      <div className="w-full max-w-3xl mx-auto py-8 flex flex-col h-[85vh]">
        <div className="bg-surface border border-border rounded-2xl flex flex-col flex-1 overflow-hidden shadow-lg items-center justify-center p-8 text-center">
          <ShieldBan size={64} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">Usuário Bloqueado</h2>
          <p className="text-muted mb-6">
            Não é possível enviar ou receber mensagens deste usuário.
          </p>
          <Link 
            href="/mensagens" 
            className="bg-accent text-white font-bold px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Voltar para Mensagens
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8 flex flex-col h-[85vh] relative">
      <div className="bg-surface border border-border rounded-2xl flex flex-col flex-1 overflow-hidden shadow-lg relative">
        
        <div className="p-4 border-b border-border bg-bg/50 flex items-center gap-4">
          <Link href="/mensagens" className="text-muted hover:text-text transition-colors">
            <ArrowLeft size={20} />
          </Link>
          
          <Link href={`/perfil/${targetProfile?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-border">
              {targetProfile?.avatar_url ? (
                <Image src={targetProfile.avatar_url} alt="Avatar" fill sizes="40px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold">{targetProfile?.username?.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-text">{targetProfile?.username}</h1>
                {targetProfile?.is_admin && <SeloAdmin />}
              </div>
              <p className="text-xs text-muted">Mensagem Direta</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg/20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Diga oi para {targetProfile?.username}!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === myUserId;
              const podeDeletar = isMe || isAdmin;
              const isTemporaria = msg.id.startsWith('temp-');

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                  <div className="flex items-center gap-2 max-w-[70%]">
                    {podeDeletar && !isTemporaria && (
                      <button 
                        onClick={() => handleDeletarMensagem(msg.id)}
                        className={`opacity-40 group-hover:opacity-100 transition-opacity text-muted hover:text-red-500 ${isMe ? 'order-first' : 'order-last'}`}
                        title="Apagar mensagem"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    
                    <div className={`p-3 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-accent text-white rounded-tr-sm' 
                        : 'bg-surface text-text rounded-tl-sm border border-border'
                    } ${isTemporaria ? 'opacity-60' : ''}`}>
                      {msg.content}
                      <span className={`text-[10px] block mt-1 ${isMe ? 'text-white/70 text-right' : 'text-muted text-left'}`}>
                        {isTemporaria ? 'Enviando...' : formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleEnviar} className="p-3 border-t border-border bg-surface flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={chatBloqueado}
            className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || chatBloqueado} 
            className="bg-accent text-white p-3 rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors cursor-pointer"
          >
            <Send size={20} />
          </button>
        </form>

        {/* MODAL DE CONFIRMAÇÃO DE DELEÇÃO */}
        {mensagemParaDeletar && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
    </div>
  );
}