'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send, ArrowLeft, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SeloAdmin } from '@/components/layout/SeloAdmin';
import { TelaBloqueio } from '@/components/layout/TelaBloqueio'; // <-- IMPORT

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
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let channel: any;

    const init = async () => {
      const { data: config } = await supabase.from('site_config').select('chat_enabled').single();
      if (config?.chat_enabled === false) {
        setChatBloqueado(true);
        setLoading(false);
        return;
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

      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs);
      setLoading(false);
      
      await supabase.from('direct_messages').update({ is_read: true }).eq('sender_id', targetUserId).eq('receiver_id', user.id).eq('is_read', false);

      const channelName = `chat-privado-${targetUserId}-${Date.now()}`;
      channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload: any) => {
          if (chatBloqueado) return;

          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === myUserId && (newMsg as any).receiver_id === targetUserId) ||
            (newMsg.sender_id === targetUserId && (newMsg as any).receiver_id === myUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      );

      channel.subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
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

  const handleDeletarMensagem = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar esta mensagem?')) return;

    const { error } = await supabase.from('direct_messages').delete().eq('id', id);
    
    if (error) {
      alert('Erro ao apagar a mensagem.');
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

  return (
    <div className="w-full max-w-3xl mx-auto py-8 flex flex-col h-[85vh]">
      <div className="bg-surface border border-border rounded-2xl flex flex-col flex-1 overflow-hidden shadow-lg">
        
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

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                  <div className="flex items-center gap-2 max-w-[70%]">
                    {podeDeletar && (
                      <button 
                        onClick={() => handleDeletarMensagem(msg.id)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-500 ${isMe ? 'order-first' : 'order-last'}`}
                        title="Apagar mensagem"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    
                    <div className={`p-3 rounded-2xl text-sm ${
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

      </div>
    </div>
  );
}