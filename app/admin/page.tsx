import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Users, MessageSquare, Star, Eye, Tv } from 'lucide-react';
import { ToggleChat } from '@/components/admin/ToggleChat';
import { ToggleFeed } from '@/components/admin/ToggleFeed';
import { GerenciarStreaming } from '@/components/admin/GerenciarStreaming';
import { GraficoAnalytics } from '@/components/admin/GraficoAnalytics';

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

  const { data: config } = await supabaseAdmin.from('site_config').select('chat_enabled, feed_enabled').single();
  const chatAtivo = config?.chat_enabled ?? true;
  const feedAtivo = config?.feed_enabled ?? true;

  const { data: users } = await supabaseAdmin.from('profiles').select('id');
  const { data: allStatus } = await supabaseAdmin.from('user_anime').select('status, rating');

  let analyticsData: any[] = [];
  try {
    const vercelRes = await fetch('https://api.vercel.com/v1/query/web-analytics/visits/aggregate?projectId=' + process.env.VERCEL_PROJECT_ID, {
      headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` },
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

  const totalNotas = allStatus?.filter(s => s.rating && s.rating > 0) || [];
  const mediaGeral = totalNotas.length > 0 ? (totalNotas.reduce((acc, curr) => acc + (curr.rating || 0), 0) / totalNotas.length).toFixed(1) : '0.0';

  return (
    <div>
      {/* BLOCO DE CONTROLE (APENAS CHAT E FEED) */}
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
          <div><p className="text-sm text-muted">Média de Notas</p><p className="text-2xl font-bold text-text">{mediaGeral}</p></div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><MessageSquare size={24} /></div>
          <div><p className="text-sm text-muted">Animes Marcados</p><p className="text-2xl font-bold text-text">{allStatus?.length || 0}</p></div>
        </div>
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
    </div>
  );
}