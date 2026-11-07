'use client';

import { useState } from 'react';
import { BotaoPostarFeed } from './BotaoPostarFeed';
import { CarrosselImagens } from '@/components/feed/CarrosselImagens';
import { MessageSquareText, Palette, Check } from 'lucide-react';

interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: string;
}

const OPCOES_TEMAS = [
  { id: 'padrao', nome: 'Padrão (Dark)', corFundo: 'bg-[#0a0a0f]', corBorda: 'border-purple-500' },
  { id: 'cyberpunk', nome: 'Cyberpunk', corFundo: 'bg-black', corBorda: 'border-cyan-400' },
  { id: 'aesthetic', nome: 'Aesthetic', corFundo: 'bg-[#f6f5f2]', corBorda: 'border-purple-400' },
];

export function GeradorCard({ animes, username, feedLiberado }: { animes: AnimeData[], username: string, feedLiberado: boolean }) {
  const [legenda, setLegenda] = useState('');
  const [temaSelecionado, setTemaSelecionado] = useState('padrao');

  const imagensCarrossel = animes.map(anime => anime.coverUrl);

  let previewBg = '#0a0a0f';
  let previewText = '#ffffff';
  let previewBorder = 'transparent';
  let previewShadow = 'none';
  let accentBg = '#a855f7';

  if (temaSelecionado === 'cyberpunk') {
    previewBg = '#000000';
    previewText = '#00ffcc';
    previewBorder = '#00ffcc';
    previewShadow = '0 0 15px rgba(0, 255, 204, 0.4)';
    accentBg = '#00ffcc';
  } else if (temaSelecionado === 'aesthetic') {
    previewBg = '#f6f5f2';
    previewText = '#333333';
    accentBg = '#a855f7';
  }

  return (
    <div className="mt-8 flex flex-col items-center w-full">
      
      <div className="w-full max-w-md mb-6 bg-surface border border-border rounded-xl p-4 shadow-sm">
        <label className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <Palette size={16} /> Estilo do Card (Top 10)
        </label>
        <div className="flex gap-3">
          {OPCOES_TEMAS.map((tema) => (
            <button
              key={tema.id}
              onClick={() => setTemaSelecionado(tema.id)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all
                ${temaSelecionado === tema.id ? tema.corBorda : 'border-transparent hover:border-border'}
                ${tema.corFundo}
              `}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${temaSelecionado === tema.id ? 'bg-accent text-white' : 'bg-black/20'}`}>
                {temaSelecionado === tema.id && <Check size={12} strokeWidth={3} />}
              </div>
              <span className={`text-xs font-medium ${tema.id === 'aesthetic' ? 'text-gray-800' : 'text-white'}`}>
                {tema.nome}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div 
        className="w-full max-w-md mx-auto mb-4 rounded-xl overflow-hidden transition-all duration-300"
        style={{ backgroundColor: previewBg }}
      >
        <div className="p-3 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: accentBg }}
          >
            A
          </div>
          <span className="text-sm font-bold" style={{ color: previewText }}>@{username}</span>
          <span className="ml-auto text-xs uppercase tracking-widest opacity-70" style={{ color: previewText }}>Top 10</span>
        </div>
        
        <div 
          className="w-full border-2"
          style={{ 
            borderColor: previewBorder,
            boxShadow: previewShadow
          }}
        >
          <CarrosselImagens imagens={imagensCarrossel} isRanking={true} />
        </div>

        <div className="p-3 flex justify-center items-center gap-2 opacity-80">
          <div 
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: previewText, color: previewText }}
          >
             <span className="text-[8px] font-bold">A</span>
          </div>
          <span className="text-xs font-bold tracking-widest" style={{ color: previewText }}>ANIVERSE</span>
        </div>
      </div>

      <div className="w-full max-w-md mb-4">
        <label className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
          <MessageSquareText size={16} /> Legenda do Post
        </label>
        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          placeholder="Escreva algo sobre o seu Top 10..."
          rows={3}
          className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

      <div className="w-full max-w-md">
        <BotaoPostarFeed 
          animes={animes} 
          legenda={legenda} 
          feedLiberado={feedLiberado} 
          tema={temaSelecionado}
        />
      </div>

    </div>
  );
}