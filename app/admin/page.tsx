import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Users, MessageSquare, ArrowLeft, Star, MessageSquareWarning, Tv, Eye } from 'lucide-react';
import { BotaoNotificar } from '@/components/admin/BotaoNotificar';
import { ToggleChat } from '@/components/admin/ToggleChat';
import { ToggleFeed } from '@/components/admin/ToggleFeed';
import { CardFeedback } from '@/components/admin/CardFeedback';
import { GerenciarStreaming } from '@/components/admin/GerenciarStreaming';
import { GraficoAnalytics } from '@/components/admin/GraficoAnalytics';

// 1. Definimos o tipo que o gráfico espera receber
interface AnalyticsData {
  date: string;
  visitors: number;
}

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return <div className="text-red-500 p-8">Acesso Negado</div>;

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Busca a configuração do site
  const { data: config } = await supabaseAdmin.from('site_config').select('chat_enabled, feed_enabled').single();
  const chatAtivo = config?.chat_enabled ?? true;
  const feedAtivo = config?.feed_enabled ?? true;

  // 2. Busca usuários e estatísticas
  const { data: users } = await supabaseAdmin.from('profiles').select('id, username, avatar_url, created_at').order('created_at', { ascending: false });
  const { data: allStatus } = await supabaseAdmin.from('user_anime').select('user_id, status, rating');

  // 3. Busca os feedbacks (só para admin)
  const { data: feedbacks } = await supabaseAdmin
    .from('feedbacks')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(20);

  // 4. Busca os dados de Analytics da Vercel
  // 2. Tipamos a variável com o array correto
  let analyticsData: AnalyticsData[] = [];
  try {
    const vercelRes = await fetch('https://api.vercel.com/v1/query/web-analytics/visits/aggregate?projectId=' + process.env.VERCEL_PROJECT_ID, {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
      },
      next: { revalidate: 3600 } 
    });

    if (vercelRes.ok) {
      const vercelJson = await vercelRes.json();
      if (vercelJson.data && vercelJson.data.length > 0) {
        analyticsData = vercelJson.data[0].data.map((item: any) => ({
          date: new Date(item.timestamp).toISOString().split('T')[0],
          visitors: item.count
        }));
      }
    }
  } catch (error) {
    console.error("Erro ao buscar dados da Vercel:", error);
  }

  const usersData = (users || []).map(u => {
    const userStatus = (allStatus || []).filter(s => s.user_id === u.id);
    const notas = userStatus.filter(s => s.rating && s.rating > 0);
    return {
      ...u,
      assistindo: userStatus.filter(s => s.status === 'assistindo').length,
      concluido: userStatus.filter(s => s.status === 'concluido').length,
      quero: userStatus.filter(s => s.status === 'quero').length,
      totalNotas: notas.length,
      media: notas.length > 0 ? notas.reduce((acc, curr) => acc + (curr.rating || 0), 0) / notas.length : 0
    };
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-accent" size={32} />
          <h1 className="text-3xl font-bold text-text">Painel de Administração</h1>
        </div>
        <Link href="/" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Voltar para a Home
        </Link>
      </div>

      {/* BLOCO DE CONTROLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              {chatAtivo ? '🟢 Chat Liberado' : '🔴 Chat Bloqueado'}
            </h2>
            <p className="text-muted text-sm mt-1">
              {chatAtivo ? 'Os usuários podem enviar mensagens.' : 'Os usuários veem uma tela de manutenção.'}
            </p>
          </div>
          <ToggleChat inicial={chatAtivo} />
        </div>

        <div className="bg-surface border border-border p-6 rounded-xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              {feedAtivo ? '🟢 Feed Liberado' : '🔴 Feed Bloqueado'}
            </h2>
            <p className="text-muted text-sm mt-1">
              {feedAtivo ? 'Os usuários podem postar no Feed.' : 'Os usuários veem uma tela de manutenção.'}
            </p>
          </div>
          <ToggleFeed inicial={feedAtivo} />
        </div>
      </div>

      {/* GERENCIADOR DE STREAMING */}
      <div className="bg-surface border border-border p-6 rounded-xl mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Tv className="text-accent" size={24} />
          <h2 className="text-xl font-bold text-text">Gerenciar Disponibilidade</h2>
        </div>
        <GerenciarStreaming />
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-lg text-accent"><Users size={24} /></div>
          <div><p className="text-sm text-muted">Total de Usuários</p><p className="text-2xl font-bold text-text">{users?.length || 0}</p></div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500"><Star size={24} /></div>
          <div><p className="text-sm text-muted">Média de Notas</p><p className="text-2xl font-bold text-text">{(usersData.reduce((acc, u) => acc + u.media, 0) / (usersData.filter(u => u.totalNotas > 0).length || 1)).toFixed(1)}</p></div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><MessageSquare size={24} /></div>
          <div><p className="text-sm text-muted">Animes Marcados</p><p className="text-2xl font-bold text-text">{allStatus?.length || 0}</p></div>
        </div>
        {/* NOVO CARD DE VISITAS TOTAIS */}
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><Eye size={24} /></div>
          <div>
            <p className="text-sm text-muted">Visitantes (30d)</p>
            <p className="text-2xl font-bold text-text">
              {analyticsData.reduce((acc, curr) => acc + curr.visitors, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE ANALYTICS */}
      <div className="bg-surface border border-border p-6 rounded-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="text-accent" size={24} />
            <h2 className="text-xl font-bold text-text">Acessos ao Site (Últimos 7 dias)</h2>
          </div>
        </div>
        <GraficoAnalytics data={analyticsData} />
      </div>

      {/* TABELA DE USUÁRIOS */}
      <h2 className="text-xl font-bold text-text mb-4">Todos os Usuários</h2>
      <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto mb-10">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-bg border-b border-border text-muted">
            <tr>
              <th className="p-4 font-medium">Usuário</th>
              <th className="p-4 font-medium">Assistindo</th>
              <th className="p-4 font-medium">Concluído</th>
              <th className="p-4 font-medium">Quero Ver</th>
              <th className="p-4 font-medium">Média</th>
              <th className="p-4 font-medium text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usersData.map((u) => (
              <tr key={u.id} className="hover:bg-bg/50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-bold">{u.username?.charAt(0).toUpperCase() || '?'}</div>
                  )}
                  <span className="font-bold text-text">{u.username || 'Sem nome'}</span>
                </td>
                <td className="p-4 text-blue-500 font-medium">{u.assistindo}</td>
                <td className="p-4 text-green-500 font-medium">{u.concluido}</td>
                <td className="p-4 text-yellow-500 font-medium">{u.quero}</td>
                <td className="p-4 text-text font-medium">{u.totalNotas > 0 ? u.media.toFixed(1) : 'N/A'}</td>
                <td className="p-4 text-center"><BotaoNotificar userId={u.id} username={u.username || 'Usuário'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SEÇÃO DE FEEDBACKS */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareWarning className="text-accent" size={24} />
        <h2 className="text-xl font-bold text-text">Feedbacks e Sugestões</h2>
      </div>
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {feedbacks?.length === 0 ? (
          <p className="p-6 text-muted text-sm">Nenhum feedback recebido ainda.</p>
        ) : (
          feedbacks?.map((fb) => (
            <CardFeedback key={fb.id} feedback={fb} />
          ))
        )}
      </div>
    </div>
  );
}