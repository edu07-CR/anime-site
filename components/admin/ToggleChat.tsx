'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ToggleChat({ inicial }: { inicial: boolean }) {
  const [enabled, setEnabled] = useState(inicial);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    await fetch('/api/admin/toggle-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled })
    });
    setEnabled(!enabled);
    setLoading(false);
    router.refresh();
  };

  return (
    <button 
      onClick={toggle} 
      disabled={loading} 
      className={`px-6 py-3 rounded-lg font-bold text-white transition-all cursor-pointer ${
        enabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
      }`}
    >
      {loading ? 'Aguarde...' : enabled ? 'Desligar Chat' : 'Ligar Chat'}
    </button>
  );
}