'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, Bookmark, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AcoesAnime({ animeId }: { animeId: number }) {
  const supabase = createClient();
  const [status, setStatus] = useState<string | null>(null);
  const [nota, setNota] = useState<number>(0);
  const [hoverNota, setHoverNota] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('user_anime')
        .select('status, rating')
        .eq('user_id', user.id)
        .eq('anime_id', animeId)
        .single();

      if (data) {
        setStatus(data.status);
        setNota(data.rating || 0);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [animeId, supabase]);

  const salvarNoBanco = async (novoStatus: string | null, novaNota: number) => {
    if (!userId) return;
    setIsSaving(true);
    await supabase.from('user_anime').upsert({
      user_id: userId, anime_id: animeId, status: novoStatus, rating: novaNota, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,anime_id' });
    setIsSaving(false);
  };

  const lidarComStatus = async (novoStatus: string) => {
    const statusFinal = status === novoStatus ? null : novoStatus;
    setStatus(statusFinal);
    await salvarNoBanco(statusFinal, nota);
  };

  const lidarComNota = async (novaNota: number) => {
    const notaFinal = nota === novaNota ? 0 : novaNota;
    setNota(notaFinal);
    await salvarNoBanco(status, notaFinal);
  };

  if (loading) return <div className="h-[100px] flex items-center text-muted"><Loader2 className="animate-spin mr-2" /> Carregando...</div>;

  return (
    <div className="flex flex-col w-full relative">
      {!userId && (
        <div className="absolute inset-0 z-10 bg-bg/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border">
          <span className="text-sm font-medium text-text">Faça login para salvar.</span>
        </div>
      )}

      {/* REDUZIDO O GAP DE 4 PARA 2 */}
      <div className={`transition-opacity duration-300 ${!userId ? 'opacity-30 pointer-events-none' : ''} flex flex-col gap-2 w-full`}>
        
        {/* 1. BLOCO DE NOTA */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted">Sua nota:</span>
          <div className="flex items-center gap-1">
            {[2, 4, 6, 8, 10].map((valorEstrela) => (
              <button
                key={valorEstrela}
                onMouseEnter={() => setHoverNota(valorEstrela)}
                onMouseLeave={() => setHoverNota(0)}
                onClick={() => lidarComNota(valorEstrela)}
                className="transition-transform hover:scale-110 cursor-pointer"
              >
                <Star 
                  size={24} 
                  className={`${
                    valorEstrela <= (hoverNota || nota) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-border fill-transparent'
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-bold text-text ml-1">{nota > 0 ? nota : ''}</span>
          {isSaving && <Loader2 className="animate-spin text-accent" size={16} />}
        </div>

        {/* 2. GRUPO DE STATUS */}
        <div className="flex items-center gap-6 border-b border-border pb-2 w-fit">
          <button
            onClick={() => lidarComStatus('assistindo')}
            className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all cursor-pointer border-b-2 ${
              status === 'assistindo' 
                ? 'text-accent border-accent' 
                : 'text-muted border-transparent hover:text-text'
            }`}
          >
            <PlayCircle size={16} /> Assistindo
          </button>
          <button
            onClick={() => lidarComStatus('quero')}
            className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all cursor-pointer border-b-2 ${
              status === 'quero' 
                ? 'text-yellow-500 border-yellow-500' 
                : 'text-muted border-transparent hover:text-text'
            }`}
          >
            <Bookmark size={16} /> Quero Assistir
          </button>
          <button
            onClick={() => lidarComStatus('concluido')}
            className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all cursor-pointer border-b-2 ${
              status === 'concluido' 
                ? 'text-green-500 border-green-500' 
                : 'text-muted border-transparent hover:text-text'
            }`}
          >
            <CheckCircle2 size={16} /> Concluído
          </button>
        </div>
      </div>
    </div>
  );
}