'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Play, Pause, Info, Share2 } from 'lucide-react'; // Adicionado Share2

interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: string;
}

export function StoriesPlayer({ 
  animes, 
  username, 
  avatarUrl, 
  onClose 
}: { 
  animes: AnimeData[], 
  username: string, 
  avatarUrl: string,
  onClose: () => void 
}) {
  const [indexAtual, setIndexAtual] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progresso, setProgresso] = useState(0);
  
  const whooshRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isPlaying || animes.length === 0) return;

    const duracaoSlide = 4000; 
    const intervalo = 50; 
    const passo = (intervalo / duracaoSlide) * 100;

    const timer = setInterval(() => {
      setProgresso((prev) => {
        if (prev >= 100) {
          if (indexAtual < animes.length - 1) {
            setIndexAtual((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            clearInterval(timer);
            return 100;
          }
        }
        return prev + passo;
      });
    }, intervalo);

    return () => clearInterval(timer);
  }, [isPlaying, indexAtual, animes.length]);

  useEffect(() => {
    if (whooshRef.current) {
      whooshRef.current.currentTime = 0;
      whooshRef.current.play().catch(() => {});
    }
  }, [indexAtual]);

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = 0.3;
      musicRef.current.play().catch(() => {});
    }
    return () => {
      if (musicRef.current) musicRef.current.pause();
    };
  }, []);

  // Função para compartilhar o link do site
  const handleShare = async () => {
    const url = window.location.origin; // Pega a URL base do site
    const shareData = {
      title: 'AniVerse | Lançamentos e Top 5',
      text: `Olha o meu Top 5 de animes no AniVerse! @${username}`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copia para a área de transferência
        await navigator.clipboard.writeText(url);
        alert('Link do AniVerse copiado para a área de transferência!');
      }
    } catch (error) {
      console.log('Compartilhamento cancelado ou falhou', error);
    }
  };

  if (animes.length === 0) return null;

  const animeAtual = animes[indexAtual];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      
      <audio ref={whooshRef} src="/sounds/whoosh.mp3" preload="auto" />
      <audio ref={musicRef} src="/sounds/musica-fundo.mp3" loop preload="auto" />

      <div className="relative w-full h-full max-w-md aspect-[9/16] bg-[#0a0a0f] overflow-hidden shadow-2xl">
        
        <div className="absolute inset-0">
          <Image 
            src={animeAtual.coverUrl} 
            alt={animeAtual.title} 
            fill 
            className="object-cover opacity-30 blur-md"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>

        <div className="absolute top-4 left-4 right-4 flex gap-1 z-50">
          {animes.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ width: idx < indexAtual ? '100%' : idx === indexAtual ? `${progresso}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-full border-2 border-accent overflow-hidden bg-surface">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-accent font-bold">A</div>
              )}
            </div>
            <span className="text-white font-bold text-sm shadow-md">@{username}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsPlaying(!isPlaying)} className="text-white p-2 cursor-pointer bg-black/30 rounded-full backdrop-blur-sm">
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={onClose} className="text-white p-2 cursor-pointer bg-black/30 rounded-full backdrop-blur-sm">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 text-center pt-20 pb-24">
          <div className="mb-4 bg-accent text-white font-black text-4xl w-16 h-16 flex items-center justify-center rounded-2xl shadow-xl shadow-accent/50">
            #{indexAtual + 1}
          </div>

          <div className="relative w-48 h-72 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 mb-6">
            <Image src={animeAtual.coverUrl} alt={animeAtual.title} fill className="object-cover" />
          </div>

          <h2 className="text-white font-black text-2xl line-clamp-2 leading-tight drop-shadow-lg mb-3 px-4">
            {animeAtual.title}
          </h2>

          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full text-yellow-400 font-bold text-sm">
            ⭐ {animeAtual.score}
          </div>
        </div>

        {/* RODAPÉ: Logo, Dica e Botão de Compartilhar */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-3 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center bg-black/50">
              <span className="text-accent font-black text-lg">A</span>
            </div>
            <span className="text-white font-black tracking-wider text-xl">ANIVERSE</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-white/60 text-[10px] bg-black/40 px-3 py-1 rounded-full">
            <Info size={12} />
            Grave a tela do seu celular para postar!
          </div>

          {/* BOTÃO DE COMPARTILHAR */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-colors cursor-pointer mt-2"
          >
            <Share2 size={16} />
            Compartilhar o AniVerse
          </button>
        </div>

      </div>
    </div>
  );
}