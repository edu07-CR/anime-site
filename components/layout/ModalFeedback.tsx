'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Send, Loader2, MessageSquareWarning } from 'lucide-react';

export function ModalFeedback({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState('sugestao');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  
  const supabase = createClient();

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) return;

    setLoading(true);
    setErro('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Você precisa estar logado.');

      const { error } = await supabase.from('feedbacks').insert({
        user_id: user.id,
        type: tipo,
        message: mensagem
      });

      if (error) throw new Error(error.message);

      setSucesso(true);
      setTimeout(onClose, 2000); // Fecha após 2 segundos
    } catch (error: any) {
      setErro(error.message || 'Erro ao enviar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-surface rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 text-text font-bold">
            <MessageSquareWarning size={20} className="text-accent" />
            Enviar Feedback
          </div>
          <button onClick={onClose} className="text-muted hover:text-red-500"><X size={24} /></button>
        </div>

        {sucesso ? (
          <div className="p-8 text-center text-green-500 flex flex-col items-center gap-2">
            <div className="bg-green-500/10 p-4 rounded-full mb-2">✓</div>
            <h3 className="text-xl font-bold">Mensagem Enviada!</h3>
            <p className="text-muted text-sm">Obrigado por ajudar a melhorar o AniVerse.</p>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="p-4 space-y-4">
            {erro && <div className="bg-red-500/10 text-red-500 p-2 rounded text-sm">{erro}</div>}

            <div>
              <label className="text-sm font-medium text-text mb-1 block">O que você quer enviar?</label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent"
              >
                <option value="sugestao">Sugestão de melhoria</option>
                <option value="bug">Relatar um erro (Bug)</option>
                <option value="denuncia">Denúncia de conteúdo</option>
                <option value="outro">Outro assunto</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-1 block">Sua mensagem</label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Descreva o que você está pensando..."
                rows={4}
                required
                className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !mensagem.trim()}
              className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}