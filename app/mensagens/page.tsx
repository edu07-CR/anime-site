'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, Users, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SeloAdmin } from '@/components/layout/SeloAdmin';
import { ChatComunidade } from './ChatComunidade';

export default function MensagensPage() {
  const [abaAtiva, setAbaAtiva] = useState<'comunidade' | 'privadas'>('comunidade');
  const [conversas, setConversas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatBloqueado, setChatBloqueado] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAndFetch = async () => {
      // 1. Verifica se o chat está bloqueado
      const { data: config } = await supabase.from('site_config').select('chat_enabled').single();
      if (config?.chat_enabled === false) {
        setChatBloqueado(true);
        setLoading(false);
        return;
      }

      // 2. Busca as conversas privadas
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mensagens } = await supabase
        .from('direct_messages')
        .select(`
          id, sender_id, receiver_id, content, created_at, is_read,
          sender:profiles!direct_messages_sender_id_fkey (id, username, avatar_url, is_admin),
          receiver:profiles!direct_messages_receiver_id_fkey (id, username, avatar_url, is_admin)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (mensagens) {
        const conversasMap = new Map();
        mensagens.forEach((msg: any) => {
          const isSender = msg.sender_id === user.id;
          const outroUsuario = isSender ? msg.receiver : msg.sender;
          
          if (!conversasMap.has(outroUsuario.id)) {
            conversasMap.set(outroUsuario.id, {
              usuario: outroUsuario,
              ultimaMensagem: msg.content,
              data: msg.created_at,
              naoLidas: (!isSender && !msg.is_read) ? 1 : 0
            });
          } else {
            if (!isSender && !msg.is_read) {
              const conversa = conversasMap.get(outroUsuario.id);
              conversa.naoLidas += 1;
            }
          }
        });
        setConversas(Array.from(conversasMap.values()));
      }
      setLoading(false);
    };
    checkAndFetch();
  }, [supabase]);

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  // TELA DE MANUTENÇÃO DO CHAT
    if (chatBloqueado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="bg-surface border border-border p-6 rounded-full mb-6">
          <Lock size={48} className="text-muted" />
        </div>
        <h2 className="text-3xl font-bold text-text mb-4">Chat em Manutenção</h2>
        <p className="text-muted max-w-md mx-auto mb-8">
          Estamos preparando a comunidade do AniVerse para você. O chat será liberado em breve!
        </p>
        {/* LINK CORRIGIDO AQUI */}
        <Link href="/" className="bg-accent text-white font-bold px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
          Voltar para os Lançamentos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
        <div className="flex border-b border-border">
          <button
            onClick={() => setAbaAtiva('comunidade')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              abaAtiva === 'comunidade' ? 'bg-accent/10 text-accent border-b-2 border-accent' : 'text-muted hover:bg-bg'
            }`}
          >
            <Users size={18} /> Chat da Comunidade
          </button>
          <button
            onClick={() => setAbaAtiva('privadas')}
            className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              abaAtiva === 'privadas' ? 'bg-accent/10 text-accent border-b-2 border-accent' : 'text-muted hover:bg-bg'
            }`}
          >
            <MessageCircle size={18} /> Mensagens Privadas
          </button>
        </div>

        {abaAtiva === 'comunidade' ? (
          <ChatComunidade />
        ) : (
          <div className="min-h-[60vh] bg-bg/20">
            {conversas.length === 0 ? (
              <div className="text-center py-20">
                <MessageCircle className="mx-auto text-muted mb-4" size={48} />
                <h2 className="text-xl font-bold text-text mb-2">Nenhuma conversa privada</h2>
                <p className="text-muted text-sm">Vá no Feed ou em um Perfil e clique em "Mensagem" para começar.</p>
              </div>
            ) : (
              <div>
                {conversas.map((conv) => (
                  <Link
                    key={conv.usuario.id}
                    href={`/mensagens/${conv.usuario.id}`}
                    className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-bg/50 transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-border shrink-0">
                      {conv.usuario.avatar_url ? (
                        <Image src={conv.usuario.avatar_url} alt="Avatar" fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                          {conv.usuario.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-text truncate">{conv.usuario.username}</span>
                        {conv.usuario.is_admin && <SeloAdmin />}
                      </div>
                      <p className={`text-sm truncate ${conv.naoLidas > 0 ? 'text-text font-medium' : 'text-muted'}`}>
                        {conv.ultimaMensagem}
                      </p>
                    </div>
                    {conv.naoLidas > 0 && (
                      <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {conv.naoLidas}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}