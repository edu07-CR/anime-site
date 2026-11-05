'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Server, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ToggleAPI({ inicial }: { inicial: string }) {
  const [apiAtual, setApiAtual] = useState(inicial);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const alternarAPI = async () => {
    setLoading(true);
    const novaAPI = apiAtual === 'anilist' ? 'jikan' : 'anilist';
    
    const { error } = await supabase
      .from('site_config')
      .update({ api_preferida: novaAPI })
      .eq('id', 1);

    if (!error) {
      setApiAtual(novaAPI);
      
      // Dá um pequeno delay para o banco processar e força o reload da página inteira
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      console.error("Erro ao atualizar API:", error);
      alert("Erro ao salvar no banco de dados.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-surface border border-border p-6 rounded-xl flex flex-col justify-between h-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-text flex items-center gap-2">
          <Server className="text-accent" size={20} />
          Fonte de Dados
        </h2>
        
        {apiAtual === 'anilist' ? (
          <p className="text-muted text-sm mt-1">
            🟣 AniList (Principal - Estável)
          </p>
        ) : (
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-muted text-sm">🟢 Jikan (Forçado)</p>
            <p className="text-xs text-yellow-600 font-medium flex items-center gap-1">
              <AlertTriangle size={12} /> Atenção: O Jikan tem limite de requisições e pode ficar instável.
            </p>
          </div>
        )}
      </div>
      
      <button
        onClick={alternarAPI}
        disabled={loading}
        className="w-full bg-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : `Mudar para ${apiAtual === 'anilist' ? 'Jikan' : 'AniList'}`}
      </button>
    </div>
  );
}