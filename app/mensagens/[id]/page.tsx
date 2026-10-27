'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send, ArrowLeft, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SeloAdmin } from '@/components/layout/SeloAdmin';

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
  const [chatBloqueado, setChatBloqueado] = useState(false); // NOVO ESTADO
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let channel: any;

    const init = async () => {
      // 1. Verifica se o chat está bloqueado
      const { data: config } = await supabase.from('site_config').select('chat_enabled').single();
      if (config?.chat_enabled === false) {
        setChatBloqueado(true);
        setLoading(false);
        return; // Para aqui, não carrega a conversa
      }

      // 2. Verifica usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setMyUserId(user.id);

      // 3. Busca perfil do destinatário
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_admin')
        .eq('id', targetUserId)
        .single();
      if (profile) setTargetProfile(profile);

      // 4. Busca as mensagens
      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs);
      setLoading(false);
      
      // 5. Marca como lidas
      await supabase.from('direct_messages').update({ is_read: true }).eq('sender_id', targetUserId).eq('receiver_id', user.id).eq('is_read', false);

      // 6. Realtime
      channel = supabase
        .channel('chat-privado')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'direct_messages' },
          (payload) => {
            // Se bloqueou no meio da conversa, ignora
            if (chatBloqueado) return;

            const newMsg = payload.new as Message;
            if (
              (newMsg.sender_id === myUserId && (newMsg as any).receiver_id === targetUserId) ||
              (newMsg.sender_id === targetUserId && (newMsg as any).receiver_id === myUserId)
            ) {
              setMessages((prev) => [...prev, newMsg]);
            }
          }
        )
        .subscribe();
    };

    init();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [supabase, router, targetUserId, myUserId, chatBloqueado]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !myUserId || chatBloqueado) return;

    const msg = newMessage;
    setNewMessage('');

    await supabase.from('direct_messages').insert({
      sender_id: myUserId,
      receiver_id: targetUserId,
      content: msg
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  // TELA DE BLOQUEIO
  if (chatBloqueado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="bg-surface border border-border p-6 rounded-full mb-6">
          <Lock size={48} className="text-muted" />
        </div>
        <h2 className="text-3xl font-bold text-text mb-4">Chat em Manutenção</h2>
        <p className="text-muted max-w-md mx-auto mb-8">
          Estamos preparando a comunidade do AniVerse para você. As mensagens serão liberadas em breve!
        </p>
        <Link href="/lancamentos" className="bg-accent text-white font-bold px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
          Voltar para os Lançamentos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8 flex flex-col h-[85vh]">
      <div className="bg-surface border border-border rounded-2xl flex flex-col flex-1 overflow-hidden shadow-lg">
        
        {/* Header do Chat */}
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

        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg/20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Diga oi para {targetProfile?.username}!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === myUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-accent text-white rounded-tr-sm' 
                      : 'bg-surface text-text rounded-tl-sm border border-border'
                  }`}>
                    {msg.content}
                    <span className={`text-[10px] block mt-1 ${isMe ? 'text-white/70 text-right' : 'text-muted text-left'}`}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input de Mensagem */}
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

      </div>
    </div>
  );
}