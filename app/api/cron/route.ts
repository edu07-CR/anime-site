import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // 1. Verifica a segurança
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
    // 2. Calcula o início e o fim do dia (Fuso horário de São Paulo)
    // Nota: O AniList usa timestamps em segundos baseados em UTC, mas para simplificar, vamos pegar o dia inteiro.
    const hoje = new Date();
    const inicioDoDia = new Date(hoje.setHours(0, 0, 0, 0)).getTime() / 1000;
    const fimDoDia = new Date(hoje.setHours(23, 59, 59, 999)).getTime() / 1000;

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

    // 3. Busca no AniList
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AniVerse-Cron/1.0 (https://www.aniverse.com.br)'
      },
      body: JSON.stringify({ query, variables: { inicio: inicioDoDia, fim: fimDoDia } })
    });

    if (!res.ok) {
      throw new Error(`AniList API retornou status ${res.status}`);
    }

    const json = await res.json();
    const episodios = json.data?.Page?.airingSchedules || [];

    if (episodios.length === 0) {
      console.log(`[Cron] Nenhum episódio lançando hoje.`);
      return NextResponse.json({ message: 'Nenhum episódio lançando hoje.' });
    }

    console.log(`[Cron] Encontrados ${episodios.length} episódios lançando hoje.`);
    let notificacoesEnviadas = 0;

    // 4. Para cada anime, busca os usuários e envia notificação
    for (const ep of episodios) {
      const animeId = ep.mediaId;
      const titulo = ep.media.title.english || ep.media.title.romaji;

      // *Aviso:* Se você rodar o cron mais de uma vez no mesmo dia, ele vai criar notificações duplicadas.
      // Para um MVP, isso é aceitável. No futuro, podemos checar a tabela de notificações para evitar duplicatas.

      const { data: usuarios } = await supabaseAdmin
        .from('user_anime')
        .select('user_id')
        .eq('anime_id', animeId)
        .eq('status', 'assistindo');

      if (usuarios && usuarios.length > 0) {
        const novasNotificacoes = usuarios.map((u) => ({
          user_id: u.user_id,
          title: `Episódio de hoje: ${titulo}! 🍿`,
          // MUDANÇA: Mensagem ajustada para "hoje", não "agora"
          message: `O episódio ${ep.episode} de ${titulo} está previsto para hoje. Vá assistir!`,
          is_read: false
        }));

        const { error } = await supabaseAdmin.from('notifications').insert(novasNotificacoes);
        
        if (!error) {
          notificacoesEnviadas += novasNotificacoes.length;
        } else {
          console.error(`[Cron] Erro ao inserir notificações para ${titulo}:`, error);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      animesAnalisados: episodios.length, 
      notificacoesEnviadas 
    });

  } catch (error) {
    console.error("[Cron] Erro fatal no Cron Job:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}