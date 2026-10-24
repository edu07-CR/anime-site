import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

// Mudamos de 'edge' para 'nodejs' para evitar bloqueios de rede
export const runtime = 'nodejs'; 

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || 'usuario';
    const animesParam = searchParams.get('animes');

    if (!animesParam) return new Response('Faltando animes', { status: 400 });

    const animes = JSON.parse(animesParam);

    // Precisamos baixar as imagens e converter para Base64 aqui no servidor
    // para o gerador de imagem não ter bloqueio de CORS
    const animesComImagens = await Promise.all(
      animes.map(async (anime: any) => {
        try {
          const response = await fetch(anime.coverUrl);
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          return { ...anime, coverBase64: `data:${mimeType};base64,${base64}` };
        } catch (e) {
          return { ...anime, coverBase64: anime.coverUrl }; // Se falhar, tenta o link direto
        }
      })
    );

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', backgroundColor: '#0a0a0f', padding: '48px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Cabeçalho */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ color: '#a855f7', fontSize: '30px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Meu Top 10 Animes
            </h2>
            <h1 style={{ color: 'white', fontSize: '60px', margin: '10px 0 0 0', fontWeight: '900' }}>
              @{username}
            </h1>
          </div>

          {/* Grid de Animes */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', width: '100%' }}>
            {animesComImagens.map((anime: any, index: number) => (
              <div key={index} style={{ 
                display: 'flex', position: 'relative', width: '310px', height: '465px', 
                borderRadius: '16px', overflow: 'hidden', backgroundColor: '#14141c' 
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={anime.coverBase64} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Número */}
                <div style={{ 
                  position: 'absolute', top: '8px', left: '8px', width: '40px', height: '40px', 
                  backgroundColor: '#a855f7', color: 'white', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', borderRadius: '8px' 
                }}>
                  {index + 1}
                </div>

                {/* Título */}
                <div style={{ 
                  position: 'absolute', bottom: 0, width: '100%', padding: '12px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                }}>
                  <h3 style={{ color: 'white', fontSize: '16px', margin: 0, fontWeight: 'bold' }}>
                    {anime.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #a855f7' }}>
              <span style={{ color: '#a855f7', fontWeight: '900', fontSize: '20px', marginTop: '4px' }}>A</span>
            </div>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
              <span style={{ color: '#a855f7' }}>ANI</span>VERSE
            </span>
          </div>
        </div>
      ),
      { width: 1080, height: 1350 }
    );
  } catch (e: any) {
    console.error("Erro na geração da imagem:", e);
    return new Response(`Falha ao gerar imagem: ${e.message}`, { status: 500 });
  }
}