import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) return new NextResponse('URL missing', { status: 400 });

  try {
    const res = await fetch(imageUrl);
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache de 1 dia
        // Libera o acesso para o seu site
        'Access-Control-Allow-Origin': '*', 
      },
    });
  } catch (error) {
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}