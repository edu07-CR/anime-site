'use client';

import { useState, useOptimistic, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

export function BotaoSeguir({ targetUserId, initialIsFollowing }: { targetUserId: string, initialIsFollowing: boolean }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const [isFollowing, toggleOptimistic] = useOptimistic(
    initialIsFollowing,
    (state) => !state
  );

  const handleToggleFollow = () => {
    startTransition(async () => {
      toggleOptimistic(null); // Muda visualmente na hora
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (initialIsFollowing) {
        // Deixar de seguir
        await supabase.from('follows').delete().match({ follower_id: user.id, following_id: targetUserId });
      } else {
        // Seguir
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
      }
      
      setLoading(false);
    });
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