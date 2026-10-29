'use client';

// COLOQUE O CÓDIGO DO ANÚNCIO AQUI QUANDO TIVER (AdSense, etc)
// Se estiver vazio, o componente não mostra nada.
const CODIGO_ANUNCIO_REAL = null; 
// Exemplo futuro: const CODIGO_ANUNCIO_REAL = <div>...seu anuncio aqui...</div>;

export function EspacoAnuncio({ formato = 'banner' }: { formato?: 'banner' | 'quadrado' | 'vertical' }) {
  // Se não tiver anúncio configurado, não renderiza NADA
  if (!CODIGO_ANUNCIO_REAL) {
    return null; 
  }

  // Alturas para quando o anúncio for ativado
  const altura = formato === 'banner' ? 'h-24' : formato === 'quadrado' ? 'h-64' : 'h-96';

  return (
    <div className={`w-full ${altura} relative overflow-hidden flex items-center justify-center bg-bg/50 rounded-xl`}>
      {CODIGO_ANUNCIO_REAL}
    </div>
  );
}