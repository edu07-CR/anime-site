import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const animeId = parseInt(id);

    if (isNaN(animeId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Voltando para o AniList (mais estável)
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query ($id: Int) { Media(id: $id, type: ANIME) { id title { romaji english } coverImage { large } averageScore } }`,
        variables: { id: animeId }
      }),
      next: { revalidate: 86400 }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    const json = await res.json();
    if (!json.data || !json.data.Media) {
      return NextResponse.json({ error: 'Anime não encontrado' }, { status: 404 });
    }

    const media = json.data.Media;

    return NextResponse.json({
      id: media.id,
      title: media.title.english || media.title.romaji,
      coverUrl: media.coverImage.large,
      score: media.averageScore ? (media.averageScore / 10).toFixed(1) : 'N/A'
    });

  } catch (error) {
    console.error("Erro na rota do AniList:", error);
    return NextResponse.json({ error: 'Erro ao buscar anime' }, { status: 500 });
  }
}