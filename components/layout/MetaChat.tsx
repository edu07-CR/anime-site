'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Lock, Unlock } from 'lucide-react';

export function MetaChat() {
  const [totalUsuarios, setTotalUsuarios] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const meta = 100; // <-- Defina a meta aqui

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setTotalUsuarios(count || 0);
      setLoading(false);
    };

    fetchCount();

    // (Opcional) Escuta em tempo real para atualizar se alguém se cadastrar
    const channel = supabase
      .channel('meta-usuarios')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => { fetchCount(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  if (loading) return null;

  const faltam = Math.max(0, meta - totalUsuarios);
  const porcentagem = Math.min(100, (totalUsuarios / meta) * 100);

  if (faltam === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-green-500 font-bold">
          <Unlock size={20} /> Chat da Comunidade Liberado!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-accent/30 rounded-xl p-4 md:p-6 shadow-lg shadow-accent/10 text-center relative overflow-hidden">
      <div className="flex items-center justify-center gap-2 text-accent font-bold mb-2">
        <Lock size={20} /> Chat da Comunidade em Breve
      </div>
      <p className="text-muted text-sm mb-4">
        Faltam <strong className="text-text">{faltam}</strong> usuários para liberarmos o chat para toda a comunidade!
      </p>
      
      {/* Barra de Progresso */}
      <div className="w-full bg-bg rounded-full h-4 mb-2 border border-border overflow-hidden">
        <div 
          className="bg-accent h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${porcentagem}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted font-medium">
        <span>{totalUsuarios} cadastrados</span>
        <span>Meta: {meta}</span>
      </div>
    </div>
  );
}