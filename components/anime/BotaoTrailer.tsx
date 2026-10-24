'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';

export function BotaoTrailer({ trailerId, tituloAnime }: { trailerId?: string, tituloAnime?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!trailerId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${trailerId}/maxresdefault.jpg`;

  return (
    <>
      {/* O BOTÃO NA TELA (Formato Horizontal) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="group relative w-full md:w-80 aspect-video rounded-xl overflow-hidden border-2 border-border hover:border-accent transition-all shadow-md flex flex-col justify-end"
      >
        {/* Imagem de Fundo */}
        <img 
          src={thumbnailUrl} 
          alt="Capa do Trailer" 
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
        />
        
        {/* Fundo escuro para dar contraste (sempre fica escuro para dar foco) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* O PLAY PERSONALIZADO */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/40 group-hover:scale-110 transition-transform">
            <Play size={24} className="ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Texto no fundo do card */}
        <div className="relative z-10 p-3 w-full text-left">
          <span className="text-white font-bold text-xs tracking-wider uppercase drop-shadow-md">
            Assistir Trailer
          </span>
        </div>
      </button>

      {/* MODAL DO PLAYER (Sala Vip) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8">
          <div className="w-full max-w-5xl flex flex-col gap-4">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-accent bg-bg/50">
                  <span className="text-accent font-black text-lg leading-none mt-[1px]">A</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg md:text-xl line-clamp-1">{tituloAnime || 'Trailer'}</h3>
                  <p className="text-accent text-xs font-semibold uppercase tracking-wider">AniVerse Player</p>
                </div>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="bg-surface text-muted p-3 rounded-full hover:bg-accent hover:text-white transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* O Player */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-accent/30 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
              <iframe
                src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&color=white`}
                title="Trailer do Anime"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}