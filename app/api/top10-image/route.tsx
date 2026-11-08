import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs'; 

const THEMES = {
  padrao: {
    bg: '#0a0a0f',
    primary: '#a855f7',
    text: '#ffffff',
    cardBg: '#14141c',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
  },
  cyberpunk: {
    bg: '#000000',
    primary: '#00ffcc',
    text: '#ffffff',
    cardBg: '#111111',
    gradient: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
  },
  aesthetic: {
    bg: '#f6f5f2',
    primary: '#a855f7',
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
    const isOG = searchParams.get('formato') === 'og'; 

    const theme = THEMES[temaParam as keyof typeof THEMES] || THEMES.padrao;

    if (!animesParam) return new Response('Faltando animes', { status: 400 });
    
    let animes = JSON.parse(animesParam);
    if (isOG) animes = animes.slice(0, 6);

    // Busca as imagens dos animes E A LOGO ao mesmo tempo
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aniverse.com.br';
    
    const [animesComImagens, logoRes] = await Promise.all([
      Promise.all(
        animes.map(async (anime: any) => {
          try {
            const url = isOG ? anime.coverUrl.replace('/extraLarge/', '/large/') : anime.coverUrl;
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/jpeg';
            return { ...anime, coverBase64: `data:${mimeType};base64,${base64}` };
          } catch (e) {
            return { ...anime, coverBase64: anime.coverUrl };
          }
        })
      ),
      // Baixa a logo oficial do seu site
      fetch(`${baseUrl}/icon.svg`).catch(() => null)
    ]);

    // Converte a logo para base64 para o @vercel/og aceitar
    let logoBase64 = '';
    if (logoRes && logoRes.ok) {
      const logoBuffer = await logoRes.arrayBuffer();
      logoBase64 = `data:image/svg+xml;base64,${Buffer.from(logoBuffer).toString('base64')}`;
    }

    const width = isOG ? 1200 : 1080;
    const height = isOG ? 630 : 1350;
    const cardWidth = isOG ? 200 : 310;
    const cardHeight = isOG ? 300 : 465;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg,
            padding: isOG ? '20px' : '48px', fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: isOG ? '20px' : '40px' }}>
            <h2 style={{ color: theme.primary, fontSize: isOG ? '20px' : '30px', margin: 0, textTransform: 'uppercase' }}>
              Top 10 Animes
            </h2>
            <h1 style={{ color: theme.text, fontSize: isOG ? '40px' : '60px', margin: '5px 0 0 0', fontWeight: '900' }}>
              @{username}
            </h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isOG ? '10px' : '16px', justifyContent: 'center', width: '100%' }}>
            {animesComImagens.map((anime: any, index: number) => (
              <div key={index} style={{ 
                display: 'flex', position: 'relative', width: `${cardWidth}px`, height: `${cardHeight}px`, 
                borderRadius: '12px', overflow: 'hidden', backgroundColor: theme.cardBg,
                border: `2px solid ${temaParam === 'cyberpunk' ? theme.primary : 'transparent'}`,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={anime.coverBase64} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                <div style={{ 
                  position: 'absolute', top: '4px', left: '4px', width: isOG ? '24px' : '40px', height: isOG ? '24px' : '40px', 
                  backgroundColor: theme.primary, color: 'white', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', fontSize: isOG ? '14px' : '24px', fontWeight: 'bold', borderRadius: '6px' 
                }}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* LOGO OFICIAL NO RODAPÉ (Só aparece no card completo, não no OG do WhatsApp) */}
          {!isOG && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
              {logoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoBase64} alt="AniVerse Logo" style={{ width: '40px', height: '40px' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: `4px solid ${theme.primary}` }}>
                  <span style={{ color: theme.primary, fontWeight: '900', fontSize: '20px', marginTop: '4px' }}>A</span>
                </div>
              )}
              
              <span style={{ color: theme.text, fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
                <span style={{ color: theme.primary }}>ANI</span>VERSE
              </span>
            </div>
          )}
        </div>
      ),
      { 
        width: width, 
        height: height,
        headers: {
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        }
      }
    );
  } catch (e: any) {
    console.error("Erro na geração da imagem:", e);
    return new Response(`Falha ao gerar imagem: ${e.message}`, { status: 500 });
  }
}