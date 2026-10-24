export async function getAnimeById(id: string) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          extraLarge
        }
        bannerImage
        averageScore
        format
        status
        episodes
        seasonYear
        genres
        studios(isMain: true) {
          nodes {
            name
          }
        }
      }
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables: { id: parseInt(id) } }),
    next: { revalidate: 86400 }
  });

  const json = await response.json();

  // Se o AniList bloquear por excesso de requisições ou der erro:
if (json.errors) {
  console.error("ERRO DO ANILIST:", json.errors[0].message);
  throw new Error("AniList indisponível"); // <-- ISSO É O QUE FAZ O PAGE.TSX CAIR NO CATCH
}

  return json.data?.Media;
}