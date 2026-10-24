'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, Bookmark, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Recebe o ID do anime como propriedade
export function AcoesAnime({ animeId }: { animeId: number }) {
  const supabase = createClient();
  
  const [status, setStatus] = useState<string | null>(null);
  const [nota, setNota] = useState<number>(0);
  const [hoverNota, setHoverNota] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Busca o usuário logado e o status/nota atual deste anime
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return; // Se não estiver logado, para por aqui
      }
      
      setUserId(user.id);

      // Busca na tabela user_anime
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

  // 2. Função para salvar ou atualizar no banco
  const salvarNoBanco = async (novoStatus: string | null, novaNota: number) => {
    if (!userId) {
      alert("Você precisa estar logado para salvar seus animes!");
      return;
    }

    setIsSaving(true);
    
    // O Upsert (insere se não existir, atualiza se existir)
    const { error } = await supabase
      .from('user_anime')
      .upsert({
        user_id: userId,
        anime_id: animeId,
        status: novoStatus,
        rating: novaNota,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,anime_id' });

    if (error) {
      console.error("Erro ao salvar:", error);
      alert("Ocorreu um erro ao salvar. Tente novamente.");
    }
    
    setIsSaving(false);
  };

  // 3. Lógica dos botões
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted mb-8 h-[120px]">
        <Loader2 className="animate-spin" size={20} />
        Carregando suas preferências...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mb-8 relative">
      
      {/* Se não estiver logado, mostra um aviso por cima */}
      {!userId && (
        <div className="absolute inset-0 z-10 bg-bg/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border">
          <span className="text-sm font-medium text-text">Faça login para salvar.</span>
        </div>
      )}

      <div className={`transition-opacity duration-300 ${!userId ? 'opacity-30 pointer-events-none' : ''}`}>
        {/* BOTÕES DE STATUS */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={() => lidarComStatus('assistindo')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all border cursor-pointer ${
              status === 'assistindo'
                ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                : 'bg-surface text-text border-border hover:border-accent'
            }`}
          >
            <PlayCircle size={20} /> Assistindo
          </button>

          <button
            onClick={() => lidarComStatus('quero')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all border cursor-pointer ${
              status === 'quero'
                ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20'
                : 'bg-surface text-text border-border hover:border-yellow-500'
            }`}
          >
            <Bookmark size={20} /> Quero Assistir
          </button>

          <button
            onClick={() => lidarComStatus('concluido')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all border cursor-pointer ${
              status === 'concluido'
                ? 'bg-green-500 text-black border-green-500 shadow-lg shadow-green-500/20'
                : 'bg-surface text-text border-border hover:border-green-500'
            }`}
          >
            <CheckCircle2 size={20} /> Concluído
          </button>
        </div>

        {/* SELETOR DE NOTA */}
        <div className="flex items-center gap-3 bg-surface/50 border border-border w-fit px-4 py-2 rounded-lg">
          <span className="text-sm font-semibold text-muted">Sua nota:</span>
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
          <span className="text-sm font-bold text-text w-6 text-center">
            {nota > 0 ? nota : '-'}
          </span>
          {isSaving && <Loader2 className="animate-spin text-accent ml-2" size={16} />}
        </div>
      </div>
    </div>
  );
}