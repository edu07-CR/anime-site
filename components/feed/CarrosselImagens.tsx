'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export function CarrosselImagens({ imagens, isRanking = false }: { imagens: string[], isRanking?: boolean }) {
  const [index, setIndex] = useState(0);

  if (!imagens || imagens.length === 0) return null;

  const next = () => setIndex((prev) => (prev + 1) % imagens.length);
  const prev = () => setIndex((prev) => (prev - 1 + imagens.length) % imagens.length);

  return (
    <div className="relative w-full aspect-[2/3] bg-black overflow-hidden group">
      
      <Image
        src={imagens[index]}
        alt={`Imagem ${index + 1}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        priority={index === 0}
      />

      {/* O NÚMERO DA POSIÇÃO (SÓ APARECE SE FOR RANKING) */}
      {isRanking && (
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white font-extrabold text-lg w-10 h-10 flex items-center justify-center rounded-xl border border-white/20 z-10 shadow-lg">
          {index + 1}º
        </div>
      )}

      {imagens.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); prev(); }} 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); next(); }} 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {imagens.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}