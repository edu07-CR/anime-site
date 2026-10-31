'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notificacao {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let channel: any = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 1. Busca inicial das notificações
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setNotificacoes(data);

      // 2. Configura o Realtime (A ORDEM AQUI É CRUCIAL)
      // Usamos um nome de canal único com timestamp para evitar conflitos
      const channelName = `notificacoes-${user.id}-${Date.now()}`;
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const novaNotificacao = payload.new as Notificacao;
            setNotificacoes((prev) => [novaNotificacao, ...prev].slice(0, 10));
          }
        )
        .subscribe(); // <-- SEMPRE POR ÚLTIMO
    };

    init();

    // Fecha o menu se clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (channel) {
        supabase.removeChannel(channel); // Limpa o canal ao desmontar
      }
    };
  }, [supabase]);

  // Marcar como lida
  const marcarComoLida = async (id: string) => {
    if (!userId) return;
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    if (!userId) return;
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    setNotificacoes((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const naoLidas = notificacoes.filter((n) => !n.is_read).length;

  if (!userId) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-bg transition-colors cursor-pointer text-muted hover:text-accent"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-bg/50">
            <h3 className="font-bold text-text">Notificações</h3>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check size={12} /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="p-6 text-center text-muted text-sm">
                Nenhuma notificação por aqui.
              </div>
            ) : (
              notificacoes.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => marcarComoLida(notif.id)}
                  className={`p-4 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-bg/50 ${
                    !notif.is_read ? 'bg-accent/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.is_read && (
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-accent flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-text mb-1">{notif.title}</h4>
                      <p className="text-xs text-muted leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-muted mt-2 block">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}