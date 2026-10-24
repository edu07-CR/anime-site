'use client';

import { useState, useEffect } from 'react';

// Lista fixa na ordem que você pediu
const diasDaSemana = [
  { id: 'seg', label: 'Seg', diaSemanaJs: 1 },
  { id: 'ter', label: 'Ter', diaSemanaJs: 2 },
  { id: 'qua', label: 'Qua', diaSemanaJs: 3 },
  { id: 'qui', label: 'Qui', diaSemanaJs: 4 },
  { id: 'sex', label: 'Sex', diaSemanaJs: 5 },
  { id: 'sab', label: 'Sáb', diaSemanaJs: 6 },
  { id: 'dom', label: 'Dom', diaSemanaJs: 0 },
];

interface SeletorDiasProps {
  diaSelecionado: string;
  onChangeDia: (dia: string) => void;
}

export function SeletorDias({ diaSelecionado, onChangeDia }: SeletorDiasProps) {
  const [hojeId, setHojeId] = useState<string>('');

  // Descobre qual é o dia de hoje no fuso do Brasil assim que o componente monta
  useEffect(() => {
    const dataHoje = new Date();
    // Formata a data no fuso de São Paulo para pegar o dia da semana correto
    const diaSemanaString = dataHoje.toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo', 
      weekday: 'short' 
    });
    
    // O toLocaleDateString retorna "seg.", "ter.", etc. Vamos mapear para o nosso ID
    const mapaDias: Record<string, string> = {
      'dom.': 'dom', 'seg.': 'seg', 'ter.': 'ter', 
      'qua.': 'qua', 'qui.': 'qui', 'sex.': 'sex', 'sáb.': 'sab'
    };
    
    const hojeCalculado = mapaDias[diaSemanaString];
    setHojeId(hojeCalculado);
    
    // Se o usuário acabou de entrar no site, seleciona o dia de hoje automaticamente
    if (!diaSelecionado && hojeCalculado) {
      onChangeDia(hojeCalculado);
    }
  }, [diaSelecionado, onChangeDia]);

  return (
    <div className="w-full mb-8">
      {/* 
        scroll horizontal no mobile (overflow-x-auto) 
        e esconde a barra de rolagem (scrollbar-hide) 
      */}
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
              {/* O texto do dia */}
              <span className={`text-sm font-semibold ${isAtivo ? 'text-white' : ''}`}>
                {dia.label}
              </span>
              
              {/* Badge de HOJE */}
              {isHoje && (
                <span className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${isAtivo ? 'text-white/80' : 'text-accent'}`}>
                  HOJE
                </span>
              )}
              
              {/* Bolinha indicadora de HOJE (se não estiver ativo) */}
              {isHoje && !isAtivo && (
                <span className="absolute bottom-2 w-1 h-1 bg-accent rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}