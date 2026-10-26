'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ToggleFeed({ inicial }: { inicial: boolean }) {
  const [enabled, setEnabled] = useState(inicial);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    
    // Atualiza visualmente na hora para ficar rápido
    const newState = !enabled;
    setEnabled(newState);

    try {
      const res = await fetch('/api/admin/toggle-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Manda a chave "enabled" (é isso que a API espera)
        body: JSON.stringify({ enabled: newState }), 
      });

      if (!res.ok) {
        // Se der erro, volta pro estado anterior
        setEnabled(!newState); 
        alert('Erro ao salvar no banco.');
      } else {
        // Mágica: O Next.js busca os dados do servidor novamente (força a atualização)
        router.refresh(); 
      }
    } catch (error) {
      setEnabled(!newState);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-6 py-2 rounded-lg font-bold text-white transition-colors disabled:opacity-50 ${
        enabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
      }`}
    >
      {loading ? <Loader2 className="animate-spin" size={20} /> : enabled ? 'Bloquear Feed' : 'Liberar Feed'}
    </button>
  );
}