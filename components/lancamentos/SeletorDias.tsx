'use client';

import { useState, useEffect } from 'react';

const diasDaSemana = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' },
];

interface SeletorDiasProps {
  diaSelecionado: string;
  onChangeDia: (dia: string) => void;
}

export function SeletorDias({ diaSelecionado, onChangeDia }: SeletorDiasProps) {
  const [hojeId, setHojeId] = useState<string>('');

  useEffect(() => {
    const dataHoje = new Date();
    const diaSemanaString = dataHoje.toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo', 
      weekday: 'short' 
    });
    
    const mapaDias: Record<string, string> = {
      'dom.': 'dom', 'seg.': 'seg', 'ter.': 'ter', 
      'qua.': 'qua', 'qui.': 'qui', 'sex.': 'sex', 'sáb.': 'sab'
    };
    
    setHojeId(mapaDias[diaSemanaString] || '');
  }, []);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {diasDaSemana.map((dia) => {
          const isAtivo = diaSelecionado === dia.id;
          const isHoje = hojeId === dia.id;

          return (
            <button
              key={dia.id}
              onClick={() => onChangeDia(dia.id)}
              className={`
                relative flex-shrink-0 flex flex-col items-center justify-center 
                w-16 h-16 rounded-2xl transition-all duration-200 border
                ${isAtivo 
                  ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                  : 'bg-surface text-muted border-border hover:border-accent/50 hover:text-text'
                }
              `}
            >
              <span className={`text-sm font-semibold ${isAtivo ? 'text-white' : ''}`}>
                {dia.label}
              </span>
              
              {isHoje && (
                <span className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${isAtivo ? 'text-white/80' : 'text-accent'}`}>
                  HOJE
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}