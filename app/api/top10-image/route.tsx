import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs'; 

// 1. Definição das paletas de cores dos temas
const THEMES = {
  padrao: {
    bg: '#0a0a0f',
    primary: '#a855f7', // Roxo
    text: '#ffffff',
    cardBg: '#14141c',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
  },
  cyberpunk: {
    bg: '#000000',
    primary: '#00ffcc', // Ciano Neon
    text: '#ffffff',
    cardBg: '#111111',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
  },
  aesthetic: {
    bg: '#f6f5f2', // Bege/Creme do briefing
    primary: '#a855f7', // Roxo
    text: '#333333',
    cardBg: '#e5e5e5',
    gradient: 'linear-gradient(to top, rgba(246,245,242,0.95), transparent)',
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || 'usuario';
    const animesParam = searchParams.get('animes');
    const temaParam = searchParams.get('tema') || 'padrao';

    // Pega as cores do tema selecionado (ou usa o padrão se o tema for inválido)
    const theme = THEMES[temaParam as keyof typeof THEMES] || THEMES.padrao;

    if (!animesParam) return new Response('Faltando animes', { status: 400 });
    const animes = JSON.parse(animesParam);

    const animesComImagens = await Promise.all(
      animes.map(async (anime: any) => {
        try {
          const response = await fetch(anime.coverUrl);
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          return { ...anime, coverBase64: `data:${mimeType};base64,${base64}` };
        } catch (e) {
          return { ...anime, coverBase64: anime.coverUrl };
        }
      })
    );

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', backgroundColor: theme.bg, // Cor do fundo dinâmica
            padding: '48px', fontFamily: 'sans-serif',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Cabeçalho */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ color: theme.primary, fontSize: '30px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Meu Top 10 Animes
            </h2>
            <h1 style={{ color: theme.text, fontSize: '60px', margin: '10px 0 0 0', fontWeight: '900' }}>
              @{username}
            </h1>
          </div>

          {/* Grid de Animes */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', width: '100%' }}>
            {animesComImagens.map((anime: any, index: number) => (
              <div key={index} style={{ 
                display: 'flex', position: 'relative', width: '310px', height: '465px', 
                borderRadius: '16px', overflow: 'hidden', backgroundColor: theme.cardBg,
                border: `2px solid ${temaParam === 'cyberpunk' ? theme.primary : 'transparent'}`, // Borda neon no cyberpunk
                boxShadow: temaParam === 'cyberpunk' ? `0 0 15px ${theme.primary}` : 'none' // Glow no cyberpunk
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={anime.coverBase64} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Número */}
                <div style={{ 
                  position: 'absolute', top: '8px', left: '8px', width: '40px', height: '40px', 
                  backgroundColor: theme.primary, color: temaParam === 'aesthetic' ? '#fff' : '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '24px', fontWeight: 'bold', borderRadius: '8px' 
                }}>
                  {index + 1}
                </div>

                {/* Título */}
                <div style={{ 
                  position: 'absolute', bottom: 0, width: '100%', padding: '12px',
                  background: theme.gradient, // Gradiente dinâmico
                }}>
                  <h3 style={{ color: temaParam === 'aesthetic' ? '#1a1a1a' : '#ffffff', fontSize: '16px', margin: 0, fontWeight: 'bold' }}>
                    {anime.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: `4px solid ${theme.primary}` }}>
              <span style={{ color: theme.primary, fontWeight: '900', fontSize: '20px', marginTop: '4px' }}>A</span>
            </div>
            <span style={{ color: theme.text, fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
              <span style={{ color: theme.primary }}>ANI</span>VERSE
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