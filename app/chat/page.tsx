'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Loader2, MessageSquare, ArrowLeft, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const supabase = createClient();

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; avatar_url: string };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: oldMessages } = await supabase
        .from('chat_messages')
        .select(`id, content, created_at, user_id, profiles (username, avatar_url)`)
        .order('created_at', { ascending: true })
        .limit(50);

      if (oldMessages) setMessages(oldMessages as any);
      setLoading(false);
      setTimeout(scrollToBottom, 100);

      const channel = supabase.channel(`chat-${Math.random()}`);

      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          // Busca o perfil de quem enviou e adiciona a mensagem na tela
          supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single()
            .then(({ data: profile }) => {
              const newMsg = {
                id: payload.new.id,
                content: payload.new.content,
                created_at: payload.new.created_at,
                user_id: payload.new.user_id,
                profiles: profile || { username: 'Usuário', avatar_url: '' }
              } as Message;

              // Adiciona a mensagem (sem duplicar)
              setMessages((prev) => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              setTimeout(scrollToBottom, 100);
            });
        }
      );

      channel.subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    init();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;
    
    const content = newMessage.trim();
    setNewMessage(''); // Limpa o input imediatamente
    
    // Envia para o banco. O Realtime vai avisar quando a mensagem for salva.
    await supabase.from('chat_messages').insert({ user_id: userId, content: content });
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('id', id);
    setMessages((prev) => prev.filter(m => m.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 md:py-8 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-surface border border-border rounded-t-2xl p-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">Chat da Comunidade</h1>
            <p className="text-xs text-muted">Converse em tempo real. As mensagens são apagadas após 24h.</p>
          </div>
        </div>
        <Link href="/" className="text-sm text-accent hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>

      <div className="flex-1 bg-bg border-x border-border overflow-y-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-accent" size={32} /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted my-auto">Nenhuma mensagem ainda. Seja o primeiro a falar!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === userId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-border">
                  {msg.profiles?.avatar_url ? (
                    <Image src={msg.profiles.avatar_url} alt="Avatar" fill sizes="32px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted">
                      {msg.profiles?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-muted mb-1 px-1">{msg.profiles?.username || 'Usuário'}</span>
                  <div className="flex items-center gap-2 group">
                    {isMe && (
                      <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className={`px-4 py-2 rounded-2xl text-sm ${
                      isMe ? 'bg-accent text-white rounded-tr-sm' : 'bg-surface border border-border text-text rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                  <span className="text-[9px] text-muted mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-surface border border-border rounded-b-2xl p-4">
        {userId ? (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-bg border border-border text-text rounded-xl py-3 px-4 focus:outline-none focus:border-accent transition-colors"
            />
            <button type="submit" disabled={!newMessage.trim()} className="bg-accent text-white p-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer">
              <Send size={20} />
            </button>
          </form>
        ) : (
          <div className="text-center text-muted text-sm py-2">
            <Link href="/login" className="text-accent font-bold hover:underline">Faça login</Link> para participar do chat.
          </div>
        )}
      </div>
    </div>
  );
}