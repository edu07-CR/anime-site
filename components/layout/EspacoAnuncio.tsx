'use client';

export function EspacoAnuncio({ formato = 'banner' }: { formato?: 'banner' | 'quadrado' | 'vertical' }) {
  // Define a altura baseada no formato (mantém o espaço reservado)
  const altura = formato === 'banner' ? 'h-24' : formato === 'quadrado' ? 'h-64' : 'h-96';

  return (
    <div className={`w-full ${altura} relative overflow-hidden`}>
      {/* 
        O espaço continua aqui (invisível), mas ocupa o mesmo tamanho de antes.
        Quando você tiver o código do AdSense, basta colocar o <ins> aqui dentro.
      */}
    </div>
  );
}