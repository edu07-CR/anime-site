'use client';

import { useState } from 'react';
import { ShieldAlert, Users, MessageSquare } from 'lucide-react';

export function AdminTabs({ 
  denunciasContent, 
  usuariosContent, 
  feedbacksContent 
}: { 
  denunciasContent: React.ReactNode, 
  usuariosContent: React.ReactNode, 
  feedbacksContent: React.ReactNode 
}) {
  const [activeTab, setActiveTab] = useState<'denuncias' | 'usuarios' | 'feedbacks'>('denuncias');

  return (
    <div className="w-full">
      {/* Menu de Abas */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-border pb-4">
        <button
          onClick={() => setActiveTab('denuncias')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'denuncias' 
              ? 'bg-red-500/10 text-red-500' 
              : 'text-text/60 hover:bg-surface-hover hover:text-text'
          }`}
        >
          <ShieldAlert size={16} />
          Denúncias de Posts
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'usuarios' 
              ? 'bg-blue-500/10 text-blue-500' 
              : 'text-text/60 hover:bg-surface-hover hover:text-text'
          }`}
        >
          <Users size={16} />
          Todos os Usuários
        </button>
        <button
          onClick={() => setActiveTab('feedbacks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'feedbacks' 
              ? 'bg-purple-500/10 text-purple-500' 
              : 'text-text/60 hover:bg-surface-hover hover:text-text'
          }`}
        >
          <MessageSquare size={16} />
          Feedbacks e Sugestões
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'denuncias' && <div>{denunciasContent}</div>}
        {activeTab === 'usuarios' && <div>{usuariosContent}</div>}
        {activeTab === 'feedbacks' && <div>{feedbacksContent}</div>}
      </div>
    </div>
  );
}