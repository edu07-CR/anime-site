import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // 1. Verifica a segurança (Vercel ou Supabase chamando)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 2. Busca no AniList os animes que lançam nos próximos 20 minutos
    const agora = Math.floor(Date.now() / 1000);
    const daqui20min = agora + 1200;

    const query = `
      query ($inicio: Int, $fim: Int) {
        Page(page: 1, perPage: 50) {
          airingSchedules(airingAt_greater: $inicio, airingAt_lesser: $fim) {
            mediaId
            episode
            media {
              title { romaji english }
            }
          }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { inicio: agora - 300, fim: daqui20min } })
    });

    const json = await res.json();
    const episodios = json.data?.Page?.airingSchedules || [];

    if (episodios.length === 0) {
      return NextResponse.json({ message: 'Nenhum episódio lançando agora.' });
    }

    let notificacoesEnviadas = 0;

    // 3. Para cada anime lançando, busca os usuários que marcaram "Assistindo"
    for (const ep of episodios) {
      const animeId = ep.mediaId;
      const titulo = ep.media.title.english || ep.media.title.romaji;

      const { data: usuarios } = await supabaseAdmin
        .from('user_anime')
        .select('user_id')
        .eq('anime_id', animeId)
        .eq('status', 'assistindo');

      if (usuarios && usuarios.length > 0) {
        const novasNotificacoes = usuarios.map((u) => ({
          user_id: u.user_id,
          title: `Novo episódio de ${titulo}! 🍿`,
          message: `O episódio ${ep.episode} acabou de ser lançado. Vá assistir!`
        }));

        const { error } = await supabaseAdmin.from('notifications').insert(novasNotificacoes);
        
        if (!error) notificacoesEnviadas += novasNotificacoes.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      animesAnalisados: episodios.length, 
      notificacoesEnviadas 
    });

  } catch (error) {
    console.error("Erro no Cron Job:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}