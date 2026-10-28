'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Loader2 } from 'lucide-react';
import { deletarFeedback, toggleResolvido } from '@/app/actions/feedbacks';

interface Feedback {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  profiles: { username: string } | null;
}

export function CardFeedback({ feedback }: { feedback: Feedback }) {
  const [loading, setLoading] = useState(false);

  const handleDeletar = async () => {
    if (!confirm('Tem certeza que deseja deletar este feedback?')) return;
    setLoading(true);
    try {
      await deletarFeedback(feedback.id);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResolvido = async () => {
    setLoading(true);
    try {
      await toggleResolvido(feedback.id, feedback.is_read);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 border-b border-border last:border-0 flex flex-col gap-2 ${feedback.is_read ? 'opacity-60 bg-bg/30' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-text">{feedback.profiles?.username || 'Anônimo'}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
            feedback.type === 'bug' ? 'bg-red-500/20 text-red-500' : 
            feedback.type === 'denuncia' ? 'bg-orange-500/20 text-orange-500' : 
            'bg-accent/20 text-accent'
          }`}>
            {feedback.type}
          </span>
          {feedback.is_read && (
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} /> Resolvido
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleResolvido} 
            disabled={loading}
            title={feedback.is_read ? "Marcar como não resolvido" : "Marcar como resolvido"}
            className="text-muted hover:text-green-500 transition-colors p-1"
          >
            {feedback.is_read ? <Circle size={18} /> : <CheckCircle2 size={18} />}
          </button>
          <button 
            onClick={handleDeletar} 
            disabled={loading}
            title="Deletar feedback"
            className="text-muted hover:text-red-500 transition-colors p-1"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
          </button>
        </div>
      </div>
      <p className="text-sm text-muted">{feedback.message}</p>
      <span className="text-xs text-muted/50">
        {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
      </span>
    </div>
  );
}