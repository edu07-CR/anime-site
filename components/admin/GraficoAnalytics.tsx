'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 1. Definimos a interface dos dados
interface DadosGrafico {
  date: string;
  visitors: number;
}

// 2. Passamos a interface para o Recharts
export function GraficoAnalytics({ data }: { data: DadosGrafico[] }) {
  const dadosFormatados = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  if (!dadosFormatados || dadosFormatados.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted bg-surface rounded-xl border border-border">
        Nenhum dado de visita disponível ainda.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full mt-4">
      {/* 3. Adicionamos <any> no ResponsiveContainer e LineChart para o TS não surtar */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dadosFormatados} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#26262f" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#8a8a99" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="#8a8a99" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            allowDecimals={false}
          />
          {/* 4. Tipagem correta no Tooltip */}
          <Tooltip 
            contentStyle={{ backgroundColor: '#14141c', borderColor: '#26262f', borderRadius: '8px', color: '#e5e5ea' }}
            itemStyle={{ color: '#a855f7' }}
            formatter={(value: any) => [`${value} visitas`, 'Visitantes']}
          />
          <Line 
            type="monotone" 
            dataKey="visitors" 
            stroke="#a855f7" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#14141c' }} 
            activeDot={{ r: 6, fill: '#a855f7' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}