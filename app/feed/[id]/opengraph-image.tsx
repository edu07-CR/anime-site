import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const alt = 'Post do AniVerse';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  // Busca o post no banco para pegar as imagens e a legenda
  const { data: post } = await supabase
    .from('posts')
    .select('media_urls, caption, profiles(username)')
    .eq('id', params.id)
    .single();

  const capa = post?.media_urls?.[0] || 'https://aniverse.com.br/fallback.jpg';
  const legenda = post?.caption || 'Confira este post no AniVerse!';
  const autor = post?.profiles?.[0]?.username || 'AniVerse';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          position: 'relative',
        }}
      >
        {/* Imagem de Fundo */}
        <img
          src={capa}
          alt="Capa"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.4,
            filter: 'blur(10px)',
          }}
        />
        
        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, transparent, #0a0a0f)',
          }}
        />

        {/* Logo do AniVerse */}
        <div style={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#9333ea', fontSize: 24, fontWeight: 'bold' }}>A</span>
          </div>
          <span style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>ANIVERSE</span>
        </div>

        {/* Conteúdo do Post */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 40, textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
             {/* Mostra as 3 primeiras capas como destaque */}
            {post?.media_urls?.slice(0, 3).map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                alt={`Capa ${i + 1}`}
                style={{
                  width: 200,
                  height: 300,
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '2px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              />
            ))}
          </div>
          <h1 style={{ color: 'white', fontSize: 40, fontWeight: 'bold', marginBottom: 10, lineHeight: 1.2 }}>
            {legenda.substring(0, 80)}{legenda.length > 80 ? '...' : ''}
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 24 }}>@{autor}</p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}