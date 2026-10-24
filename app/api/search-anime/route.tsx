import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { search } = await req.json();

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query ($search: String) {
            Page(page: 1, perPage: 5) {
              media(search: $search, type: ANIME) {
                id
                title { romaji english }
                coverImage { large }
                averageScore
              }
            }
          }
        `,
        variables: { search }
      }),
      next: { revalidate: 86400 }
    });

    if (!res.ok) throw new Error('AniList falhou');

    const json = await res.json();
    
    const results = json.data.Page.media.map((media: any) => ({
      id: media.id,
      title: media.title.english || media.title.romaji,
      coverUrl: media.coverImage.large,
      score: media.averageScore ? (media.averageScore / 10).toFixed(1) : 'N/A'
    }));

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 });
  }
}