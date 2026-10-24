'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Play, Pause, Info, Volume2, VolumeX } from 'lucide-react'; // Adicionado ícones de som

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
  const [isMuted, setIsMuted] = useState(false); // Controle de mudo
  
  const whooshRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);

  // 1. Lógica de troca de slides
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

  // 2. Toca o som de transição (whoosh) a cada slide
  useEffect(() => {
    if (whooshRef.current) {
      whooshRef.current.currentTime = 0;
      whooshRef.current.play().catch(() => {});
    }
  }, [indexAtual]);

  // 3. Toca a música de fundo quando o componente monta
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = 0.3; // Volume mais baixo (30%) para não abafar
      musicRef.current.play().catch(() => {
        // Se o navegador bloquear o autoplay, só avisa no console
        console.log("Autoplay de música bloqueado.");
      });
    }
    
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
      }
    };
  }, []);

  // Função para mutar/desmutar
  const toggleMute = () => {
    if (musicRef.current) {
      musicRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (animes.length === 0) return null;

  const animeAtual = animes[indexAtual];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      
      {/* 🎵 ÁUDIOS (Invisíveis) */}
      <audio ref={whooshRef} src="/sounds/whoosh.mp3" preload="auto" />
      <audio ref={musicRef} src="/sounds/musica-fundo.mp3" loop preload="auto" />

      {/* Container 9:16 */}
      <div className="relative w-full h-full max-w-md aspect-[9/16] bg-[#0a0a0f] overflow-hidden shadow-2xl">
        
        {/* Fundo Desfocado */}
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

        {/* Barra de Progresso */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-50">
          {animes.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ 
                  width: idx < indexAtual ? '100%' : idx === indexAtual ? `${progresso}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Topo: Avatar, Controles e Mudo */}
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
            {/* Botão de Mudo */}
            <button onClick={toggleMute} className="text-white p-2 cursor-pointer bg-black/30 rounded-full backdrop-blur-sm">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="text-white p-2 cursor-pointer bg-black/30 rounded-full backdrop-blur-sm">
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={onClose} className="text-white p-2 cursor-pointer bg-black/30 rounded-full backdrop-blur-sm">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Conteúdo Central */}
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

        {/* Rodapé: Logo + Dica */}
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
        </div>

      </div>
    </div>
  );
}