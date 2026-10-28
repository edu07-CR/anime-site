'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Crown, Medal, Award, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SeloAdmin } from '../layout/SeloAdmin';

interface Criador {
  user_id: string;
  username: string;
  avatar_url: string;
  is_admin: boolean;
  total_likes: number;
  total_comments: number;
  pontuacao_total: number;
  total_posts: number;
}

export function TopCriadores() {
  const [criadores, setCriadores] = useState<Criador[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRanking = async () => {
      const { data } = await supabase.from('ranking_criadores').select('*');
      if (data) setCriadores(data);
      setLoading(false);
    };
    fetchRanking();
  }, [supabase]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="animate-spin text-accent" size={24} /></div>;
  if (criadores.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Crown className="text-yellow-500" size={24} />
        <h2 className="text-xl font-bold text-text">Top Criadores da Semana</h2>
      </div>

      <div className="flex flex-col gap-3">
        {criadores.map((user, index) => {
          let medalhaIcon = null;
          let medalhaCor = '';
          
          if (index === 0) { medalhaIcon = <Crown size={18} />; medalhaCor = 'text-yellow-400'; }
          else if (index === 1) { medalhaIcon = <Medal size={18} />; medalhaCor = 'text-gray-300'; }
          else if (index === 2) { medalhaIcon = <Medal size={18} />; medalhaCor = 'text-amber-600'; }
          else { medalhaIcon = <Award size={18} />; medalhaCor = 'text-muted'; }

          return (
            <Link 
              key={user.user_id} 
              href={`/perfil/${user.username}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg transition-colors group"
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${index < 3 ? 'bg-bg border border-border shadow-sm' : ''}`}>
                <span className={medalhaCor}>{index + 1}º</span>
              </div>
              
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-border shrink-0 group-hover:ring-2 group-hover:ring-accent transition-all">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.username} fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold">{user.username?.charAt(0).toUpperCase()}</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-text truncate group-hover:text-accent transition-colors">{user.username}</span>
                  {user.is_admin && <SeloAdmin />}
                </div>
                <span className="text-xs text-muted block">{user.total_posts} posts</span>
              </div>

              {/* PONTUAÇÃO TOTAL */}
              <div className="flex items-center gap-1 text-sm font-bold text-accent" title="Pontuação: curtidas (1) + comentários (2)">
                <span>{user.pontuacao_total} pts</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}