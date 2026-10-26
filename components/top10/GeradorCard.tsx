'use client';

import { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2 } from 'lucide-react';
import { BotaoPostarFeed } from './BotaoPostarFeed';

interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: string;
}

export function GeradorCard({ animes, username }: { animes: AnimeData[], username: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);
  const [imagensBase64, setImagensBase64] = useState<Record<number, string>>({});

  useEffect(() => {
    const carregarImagens = async () => {
      const base64Map: Record<number, string> = {};
      for (const anime of animes) {
        try {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(anime.coverUrl)}`;
          const response = await fetch(proxyUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          await new Promise((resolve) => {
            reader.onloadend = () => {
              base64Map[anime.id] = reader.result as string;
              resolve(null);
            };
          });
        } catch (error) {
          console.error(`Erro ao carregar imagem do anime ${anime.id}`, error);
        }
      }
      setImagensBase64(base64Map);
    };
    if (animes.length > 0) carregarImagens();
  }, [animes]);

  const gerarImagem = async () => {
    if (!cardRef.current) return null;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0a0a0f',
        width: 1080,
        height: 1080, // <-- MUDADO PARA 1080 PARA FICAR QUADRADO
        includeQueryParams: true,
        cacheBust: true,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      setImagemGerada(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    const dataUrl = await gerarImagem();

    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `top5-aniverse-${username.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } else {
      alert("Erro ao gerar a imagem.");
    }
    setIsGenerating(false);
  };

  return (
    <div className="mt-8 flex flex-col items-center w-full">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-md">
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer w-full"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          {isGenerating ? 'Gerando Imagem...' : 'Baixar Imagem'}
        </button>
      </div>

      {imagemGerada && (
        <BotaoPostarFeed cardImage={imagemGerada} animes={animes} />
      )}

      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        <div 
          ref={cardRef} 
          style={{ width: '1080px', height: '1080px' }} // <-- MUDADO PARA 1080
          className="bg-[#0a0a0f] p-12 flex flex-col items-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex flex-col items-center mb-6 z-10 w-full">
            <h2 className="text-3xl text-accent font-bold mb-2 uppercase tracking-widest text-center">
              Meu Top 5 Animes
            </h2>
            <h1 className="text-6xl font-black text-white text-center w-full truncate">
              @{username}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full z-10 flex-1 content-start">
            {animes.map((anime, index) => {
              const imagemSrc = imagensBase64[anime.id] || '';
              return (
                <div key={anime.id} className={`relative flex flex-col bg-surface rounded-xl overflow-hidden border border-border/50 ${index === 4 ? 'col-span-2 w-1/2 mx-auto' : ''}`}>
                  <div className="absolute top-2 left-2 w-8 h-8 bg-accent text-white text-lg font-black flex items-center justify-center rounded-lg shadow-lg z-20">
                    {index + 1}
                  </div>
                  <div className="relative w-full aspect-[2/3] bg-[#14141c]">
                    {imagemSrc ? (
                      <img src={imagemSrc} alt={anime.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted text-xs">Carregando...</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 w-full p-2 z-20">
                    <h3 className="text-white font-bold text-xs line-clamp-2 leading-tight">{anime.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 z-10">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-accent">
              <span className="text-accent font-black text-lg leading-none mt-1">A</span>
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              <span className="text-accent">ANI</span>VERSE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}