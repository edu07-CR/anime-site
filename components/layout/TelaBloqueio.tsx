'use client';

import { Lock, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface TelaBloqueioProps {
  titulo: string;
  descricao: string;
  spoiler?: ReactNode; // Onde você vai colocar a prévia
  linkVoltar?: string;
  textoVoltar?: string;
}

export function TelaBloqueio({ 
  titulo, 
  descricao, 
  spoiler, 
  linkVoltar = '/', 
  textoVoltar = 'Voltar para os Lançamentos' 
}: TelaBloqueioProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-12">
      <div className="bg-surface border border-border p-6 rounded-full mb-6 animate-pulse">
        <Lock size={48} className="text-muted" />
      </div>
      
      <h2 className="text-3xl font-bold text-text mb-4">{titulo}</h2>
      <p className="text-muted max-w-md mx-auto mb-8">{descricao}</p>

      {/* ÁREA DO SPOILER (OPCIONAL) */}
      {spoiler && (
        <div className="w-full max-w-md mb-8 p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <div className="flex items-center gap-2 mb-3 text-accent font-bold text-sm">
            <Sparkles size={16} /> Spoiler do que está por vir
          </div>
          {spoiler}
        </div>
      )}

      <Link 
        href={linkVoltar} 
        className="bg-accent text-white font-bold px-8 py-3 rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 flex items-center gap-2"
      >
        <ArrowLeft size={18} /> {textoVoltar}
      </Link>
    </div>
  );
}