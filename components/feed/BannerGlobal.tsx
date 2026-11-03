'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Crown, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function BannerGlobal() {
  const [criador, setCriador] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchTopGlobal = async () => {
      // Busca o Top 1 Geral na view de ranking (ou na sua tabela de usuários)
      // Aqui usamos a RPC que fizemos para o Top Criadores, mas sem filtro de período (Geral)
      const { data } = await supabase.rpc('get_ranking_criadores', { periodo: 'geral' });
      
      if (data && data.length > 0) {
        setCriador(data[0]); // Pega o primeiro colocado
      }
    };
    fetchTopGlobal();
  }, []);

  if (!criador) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-500/20 via-surface to-surface border border-yellow-500/30 mb-6 shadow-lg shadow-yellow-500/10">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Crown size={120} />
      </div>
      
      <div className="relative p-4 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-500 bg-bg shrink-0">
            {criador.avatar_url ? (
              <Image src={criador.avatar_url} alt={criador.username} fill sizes="64px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-yellow-500 text-xl">
                {criador.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Lenda do AniVerse</span>
            </div>
            <h2 className="text-xl font-bold text-text">{criador.username}</h2>
            <p className="text-sm text-muted">
              <strong className="text-text">{criador.pontuacao_total}</strong> pontos no ranking geral
            </p>
          </div>
        </div>

        <Link 
          href={`/perfil/${criador.username}`}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0"
        >
          Ver Perfil <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}