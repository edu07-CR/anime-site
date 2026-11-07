'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldBan, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BotaoBloquear({ targetUserId, initialIsBlocked }: { targetUserId: string, initialIsBlocked: boolean }) {
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleToggle = async () => {
    // Removemos os confirms! O clique agora é direto.
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    if (isBlocked) {
      await supabase.from('blocks').delete().match({ blocker_id: user.id, blocked_id: targetUserId });
      setIsBlocked(false);
    } else {
      await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: targetUserId });
      setIsBlocked(true);
    }
    
    setLoading(false);
    router.refresh(); // Recarrega a página para aplicar os filtros
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm cursor-pointer disabled:opacity-50 ${
        isBlocked 
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
          : 'bg-bg border border-border text-text hover:border-red-500 hover:text-red-500'
      }`}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldBan size={18} />}
      {isBlocked ? 'Desbloquear' : 'Bloquear'}
    </button>
  );
}