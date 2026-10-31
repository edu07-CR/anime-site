'use client';

import { useState, useEffect } from 'react';
import { SeletorDias } from '@/components/lancamentos/SeletorDias';
import { GridAnimes } from '@/components/lancamentos/GridAnimes';
import { AnimeData } from '@/components/lancamentos/CardAnime';
import { AlertCircle } from 'lucide-react';
import { EspacoAnuncio } from '@/components/layout/EspacoAnuncio';

// Função para descobrir a temporada atual
function getTemporadaAtual() {
  const data = new Date();
  const mes = data.getMonth(); 
  const ano = data.getFullYear();

  let temporada = '';
  if (mes >= 0 && mes <= 2) temporada = 'Inverno';
  else if (mes >= 3 && mes <= 5) temporada = 'Primavera';
  else if (mes >= 6 && mes <= 8) temporada = 'Verão';
  else temporada = 'Outono';

  return `${temporada} ${ano}`;
}

export default function Home() {
  const [diaSelecionado, setDiaSelecionado] = useState<string>('');
  const [animes, setAnimes] = useState<AnimeData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [temporada, setTemporada] = useState<string>('');
  const [erroApi, setErroApi] = useState<string | null>(null);

  // Define o dia de hoje e a temporada ao abrir
  useEffect(() => {
    setTemporada(getTemporadaAtual());

    const dataHoje = new Date();
    const diaSemanaString = dataHoje.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' });
    
    const mapaDias: Record<string, string> = { 
      'dom.': 'dom', 'seg.': 'seg', 'ter.': 'ter', 
      'qua.': 'qua', 'qui.': 'qui', 'sex.': 'sex', 'sáb.': 'sab' 
    };
    
    setDiaSelecionado(mapaDias[diaSemanaString] || 'qua');
  }, []);

  // Busca os animes
  useEffect(() => {
    if (!diaSelecionado) return;

    async function fetchAnimes() {
      setIsLoading(true);
      setErroApi(null); 
      
      try {
        const res = await fetch(`/api/test-anilist?dia=${diaSelecionado}`);
        
        if (!res.ok) {
          throw new Error("Falha na resposta do servidor");
        }

        const data = await res.json();
        
        if (data.error) {
          setErroApi("Não conseguimos carregar os lançamentos no AniVerse agora. Nossos servidores podem estar em manutenção.");
          setAnimes([]);
        } else {
          setAnimes(data.animesDeHoje || []);
        }
      } catch (error) {
        console.error("Erro ao buscar animes:", error);
        setErroApi("Falha de conexão com os servidores do AniVerse. Tente novamente em instantes.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnimes();
  }, [diaSelecionado]);

  return (
    <div className="w-full">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          {/* Título Principal (H1) */}
          <h1 className="text-2xl md:text-3xl font-bold text-text flex items-center gap-3">
            Lançamentos da Semana
            {temporada && (
              <span className="text-sm font-semibold bg-accent text-white px-3 py-1 rounded-full border border-accent">
                {temporada}
              </span>
            )}
          </h1>
          {/* Texto de Apoio (Contraste Melhorado) */}
          <p className="text-text/80 text-sm mt-2">
            Acompanhe os episódios que saem hoje e nos próximos dias.
          </p>
        </div>
      </header>

      <SeletorDias 
        diaSelecionado={diaSelecionado} 
        onChangeDia={setDiaSelecionado} 
      />

      <div className="mt-8">
        {/* Título da Seção (H2) para organizar a hierarquia */}
        <h2 className="sr-only">Animes de Hoje</h2> 

        {erroApi ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface rounded-xl border border-red-500/20">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-text mb-2">Ops, tivemos um problema!</h3>
            <p className="text-text/80 text-sm max-w-md">{erroApi}</p>
            <button 
              onClick={() => setDiaSelecionado(diaSelecionado)} 
              className="mt-6 px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent/80 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <GridAnimes animes={animes} isLoading={isLoading} />
        )}
      </div>

      {/* ESPAÇO PARA ANÚNCIO NO FINAL */}
      <div className="mt-10">
        <EspacoAnuncio formato="banner" />
      </div>
    </div>
  );
}