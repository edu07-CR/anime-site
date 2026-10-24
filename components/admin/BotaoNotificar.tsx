'use client';

import { useState } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';

export function BotaoNotificar({ userId, username }: { userId: string, username: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, message })
      });

      if (!res.ok) throw new Error('Erro ao enviar');

      alert(`Notificação enviada para ${username}!`);
      setIsOpen(false);
      setTitle('');
      setMessage('');
    } catch (error) {
      alert("Ocorreu um erro ao enviar a notificação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white transition-colors cursor-pointer"
        title="Enviar notificação"
      >
        <Bell size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl relative">
            
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-muted hover:text-red-400">
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-text mb-1 flex items-center gap-2">
              <Bell className="text-accent" /> Notificar {username}
            </h2>
            <p className="text-xs text-muted mb-6">O aviso aparecerá no sininho do usuário.</p>

            <form onSubmit={handleEnviar} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-text mb-1 block">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Novo episódio disponível!"
                  required
                  className="w-full bg-bg border border-border text-text rounded-lg py-2 px-3 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-text mb-1 block">Mensagem</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: O episódio 5 de One Piece acabou de sair!"
                  required
                  rows={3}
                  className="w-full bg-bg border border-border text-text rounded-lg py-2 px-3 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 transition-all flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Notificação'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}