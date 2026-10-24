'use client';

import { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Loader2 } from 'lucide-react';

interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: string;
}

export function GeradorCard({ animes, username }: { animes: AnimeData[], username: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagensProntas, setImagensProntas] = useState(false);

  useEffect(() => {
    let carregadas = 0;
    const total = animes.length;
    if (total === 0) return;

    animes.forEach((anime) => {
      const img = new Image();
      img.src = `/api/proxy-image?url=${encodeURIComponent(anime.coverUrl)}`;
      img.onload = () => {
        carregadas++;
        if (carregadas === total) setImagensProntas(true);
      };
      img.onerror = () => {
        carregadas++;
        if (carregadas === total) setImagensProntas(true);
      };
    });
  }, [animes]);

  const handleCompartilhar = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const opcoes = {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0a0a0f',
        width: 1080,
        height: 1920, 
        includeQueryParams: true,
        cacheBust: true,
        style: { 
          transform: 'scale(1)', 
          transformOrigin: 'top left',
          // Força a fonte a ser aplicada na raiz da captura
          fontFamily: 'Arial, Helvetica, sans-serif' 
        }
      };

      const dataUrl = await toPng(cardRef.current, opcoes);

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `top5-${username}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Meu Top 5 Animes', text: 'Olha o meu Top 5 no AniVerse!' });
      } else {
        const link = document.createElement('a');
        link.download = `top5-aniverse-${username}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Ocorreu um erro ao gerar a imagem.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        onClick={handleCompartilhar}
        disabled={isGenerating || animes.length !== 5 || !imagensProntas}
        className="flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer"
      >
        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
        {isGenerating ? 'Gerando Imagem...' : !imagensProntas ? 'Carregando capas...' : 'Baixar Imagem'}
      </button>

      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        <div 
          ref={cardRef} 
          style={{ 
            width: '1080px', 
            height: '1920px',
            fontFamily: 'Arial, Helvetica, sans-serif' // 👈 Forçando fonte local
          }} 
          className="bg-[#0a0a0f] p-10 flex flex-col items-center relative overflow-hidden justify-between"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#a855f7]/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex flex-col items-center z-10 w-full mt-4">
            <h2 className="text-3xl font-bold mb-2 uppercase tracking-widest text-center" style={{ color: '#a855f7' }}>
              Meu Top 5 Animes
            </h2>
            <h1 className="text-5xl font-black text-center w-full" style={{ color: '#ffffff' }}>
              @{username}
            </h1>
          </div>

          <div className="flex flex-col gap-5 w-full z-10 flex-1 justify-center my-6">
            {animes.map((anime, index) => (
              <div key={anime.id} className="relative flex items-center bg-[#14141c] rounded-2xl overflow-hidden border border-[#26262f] h-[260px] w-full">
                <div className="absolute top-3 left-3 w-12 h-12 bg-[#a855f7] text-white text-2xl font-black flex items-center justify-center rounded-xl shadow-lg z-20">
                  {index + 1}
                </div>

                <div className="relative w-[180px] h-full bg-[#14141c] shrink-0">
                  <img 
                    src={`/api/proxy-image?url=${encodeURIComponent(anime.coverUrl)}`} 
                    alt={anime.title} 
                    className="w-full h-full object-cover" 
                    crossOrigin="anonymous"
                  />
                </div>

                <div className="flex-1 p-6 z-20 flex flex-col justify-center h-full">
                  {/* Forçando cor branca sólida e quebra de linha no estilo inline */}
                  <h3 
                    className="text-3xl leading-tight mb-2"
                    style={{ 
                      color: '#ffffff',
                      fontWeight: 'bold',
                      wordBreak: 'break-word', 
                      whiteSpace: 'normal',
                      display: 'block'
                    }}
                  >
                    {anime.title}
                  </h3>
                  {/* Forçando cor roxa sólida */}
                  <p className="text-xl" style={{ color: '#a855f7', fontWeight: 'bold' }}>
                    Nota: {anime.score}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 z-10 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4" style={{ borderColor: '#a855f7' }}>
              <span className="font-black text-xl leading-none mt-1" style={{ color: '#a855f7' }}>A</span>
            </div>
            <span className="text-2xl font-bold tracking-wider" style={{ color: '#ffffff' }}>
              <span style={{ color: '#a855f7' }}>ANI</span>VERSE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}