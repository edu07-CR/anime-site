'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BotaoSeguir({ targetUserId, initialIsFollowing }: { targetUserId: string, initialIsFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleToggleFollow = async () => {
    setLoading(true);
    // Atualização otimista para ficar rápido na tela
    setIsFollowing(!isFollowing);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setIsFollowing(isFollowing); // Volta atrás se não tiver usuário
      return;
    }

    if (isFollowing) {
      // Deixar de seguir
      await supabase.from('follows').delete().match({ follower_id: user.id, following_id: targetUserId });
    } else {
      // Seguir
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
    }
    
    setLoading(false);
    // Atualiza os dados da página (contador de seguidores, etc) sem dar reload
    router.refresh(); 
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm cursor-pointer disabled:opacity-50 ${
        isFollowing 
          ? 'bg-surface border border-border text-text hover:border-red-500 hover:text-red-500' 
          : 'bg-accent/10 text-accent hover:bg-accent hover:text-white'
      }`}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : isFollowing ? (
        <UserCheck size={18} />
      ) : (
        <UserPlus size={18} />
      )}
      {isFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  );
}