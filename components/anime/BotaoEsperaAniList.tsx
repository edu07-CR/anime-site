'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Rocket, CheckCircle2, Loader2 } from 'lucide-react';

export function BotaoEsperaAniList() {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const supabase = createClient();

  const entrarNaLista = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Você precisa estar logado para entrar na lista.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('waitlist_anilist')
      .insert({ user_id: user.id });

    if (error) {
      if (error.code === '23505') {
        alert("Você já está na lista de espera!");
        setSucesso(true);
      } else {
        alert("Erro ao entrar na lista. Tente novamente.");
      }
    } else {
      setSucesso(true);
    }
    setLoading(false);
  };

  return (
    <div className="bg-accent/5 border border-accent/20 p-4 rounded-xl flex flex-col items-start text-left w-fit">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-accent/10 p-1.5 rounded-full text-accent">
          <Rocket size={18} />
        </div>
        <h3 className="text-sm font-bold text-text">Sincronização com AniList em breve!</h3>
      </div>
      
      <p className="text-xs text-muted mb-4 max-w-sm">
        Estamos finalizando a integração oficial com a API da AniList para que você possa salvar seus animes e notas. 
        Entre na lista de espera para ser avisado em primeira mão.
      </p>

      {sucesso ? (
        <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg text-xs">
          <CheckCircle2 size={14} /> Você já está na lista!
        </div>
      ) : (
        <button
          onClick={entrarNaLista}
          disabled={loading}
          className="flex items-center gap-2 bg-accent text-white font-bold px-4 py-2 rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50 text-xs cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : 'Entrar na Lista de Espera'}
        </button>
      )}
    </div>
  );
}