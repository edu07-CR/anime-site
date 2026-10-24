'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export function DeletarConta() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDeletar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' });
      
      if (!res.ok) throw new Error('Falha ao deletar conta');
      
      alert('Sua conta foi deletada com sucesso. Até a próxima!');
      router.push('/');
      router.refresh();
      
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao deletar sua conta. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer"
      >
        <Trash2 size={20} />
        Deletar Conta
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl relative">
            
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-center text-text mb-2">Tem certeza?</h2>
            <p className="text-center text-muted text-sm mb-8">
              Essa ação não pode ser desfeita. Todas as suas listas, notas e perfil serão apagados permanentemente do AniVerse.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 border border-border text-text rounded-lg font-bold hover:bg-bg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletar}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-50 transition-colors flex justify-center items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sim, deletar'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}