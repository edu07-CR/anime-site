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
  total_posts: number;
  pontuacao_total: number;
}

type Periodo = 'semana' | 'mes' | 'geral';

export function TopCriadores() {
  const [criadores, setCriadores] = useState<Criador[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const supabase = createClient();

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      
      // Chama a RPC nova que criamos no SQL
      const { data, error } = await supabase.rpc('get_ranking_criadores', { 
        periodo: periodo 
      });

      if (error) {
        console.error('Erro ao buscar ranking:', error);
      } else if (data) {
        setCriadores(data);
      }
      
      setLoading(false);
    };
    
    fetchRanking();
  }, [supabase, periodo]); // Recarrega toda vez que a aba mudar

  const getTitulo = () => {
    if (periodo === 'semana') return 'da Semana';
    if (periodo === 'mes') return 'do Mês';
    return 'Geral';
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
      
      {/* Header e Abas */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Crown className="text-yellow-500" size={24} />
          <h2 className="text-xl font-bold text-text">Top Criadores {getTitulo()}</h2>
        </div>

        <div className="flex bg-bg rounded-lg p-1 border border-border">
          <button 
            onClick={() => setPeriodo('semana')}
            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${periodo === 'semana' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-text'}`}
          >
            Semana
          </button>
          <button 
            onClick={() => setPeriodo('mes')}
            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${periodo === 'mes' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-text'}`}
          >
            Mês
          </button>
          <button 
            onClick={() => setPeriodo('geral')}
            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${periodo === 'geral' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-text'}`}
          >
            Geral
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-accent" size={24} /></div>
      ) : criadores.length === 0 ? (
        <p className="text-center text-muted text-sm py-4">Ninguém pontuou nesse período ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {criadores.map((user, index) => {
            let medalhaCor = '';
            if (index === 0) medalhaCor = 'text-yellow-400';
            else if (index === 1) medalhaCor = 'text-gray-300';
            else if (index === 2) medalhaCor = 'text-amber-600';
            else medalhaCor = 'text-muted';

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

                <div className="flex items-center gap-1 text-sm font-bold text-accent" title="Pontuação">
                  <span>{user.pontuacao_total} pts</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}