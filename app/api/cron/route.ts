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
    const agora = new Date();
    // Pega a data atual no fuso de SP
    const spTime = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ano = spTime.getFullYear();
    const mes = spTime.getMonth();
    const dia = spTime.getDate();

    // 00:00 em SP é 03:00 em UTC
    const inicioSP = new Date(Date.UTC(ano, mes, dia, 3, 0, 0)); 
    const inicioDoDia = inicioSP.getTime() / 1000;
    const fimDoDia = inicioDoDia + 86399; // 23:59:59 do mesmo dia

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

    if (!res.ok) throw new Error(`AniList API retornou status ${res.status}`);

    const json = await res.json();
    const episodios = json.data?.Page?.airingSchedules || [];

    if (episodios.length === 0) {
      console.log(`[Cron] Nenhum episódio lançando hoje.`);
      return NextResponse.json({ message: 'Nenhum episódio lançando hoje.' });
    }

    console.log(`[Cron] Encontrados ${episodios.length} episódios lançando hoje.`);
    let notificacoesEnviadas = 0;
    const dataInicioISO = inicioSP.toISOString();

    // 4. Para cada anime, busca os usuários e envia notificação
    for (const ep of episodios) {
      const animeId = ep.mediaId;
      const titulo = ep.media.title.english || ep.media.title.romaji;
      const tituloNotificacao = `Episódio de hoje: ${titulo}! 🍿`;

      // Anti-duplicação: checa se já enviamos essa notificação hoje
      const { data: jaNotificado } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('title', tituloNotificacao)
        .gte('created_at', dataInicioISO)
        .limit(1);

      if (jaNotificado && jaNotificado.length > 0) {
        continue; // Pula para o próximo anime
      }

      const { data: usuarios } = await supabaseAdmin
        .from('user_anime')
        .select('user_id')
        .eq('anime_id', animeId)
        .eq('status', 'assistindo');

      if (usuarios && usuarios.length > 0) {
        const novasNotificacoes = usuarios.map((u) => ({
          user_id: u.user_id,
          title: tituloNotificacao,
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