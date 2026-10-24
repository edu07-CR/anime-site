import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Users, MessageSquare, ArrowLeft, Star } from 'lucide-react';
import { BotaoNotificar } from '@/components/admin/BotaoNotificar';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  if (profileError) console.error("Erro ao buscar perfil:", profileError);

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-text mb-2">Acesso Negado</h1>
        <p className="text-muted">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: users, error: usersError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url, created_at')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error("🚨 Erro ao buscar usuários:", JSON.stringify(usersError, null, 2));
    return <div className="text-red-500 p-8">Erro ao carregar usuários. Verifique o terminal.</div>;
  }

  const { data: allStatus, error: statusError } = await supabaseAdmin
    .from('user_anime')
    .select('user_id, status, rating');

  if (statusError) {
    console.error("🚨 Erro ao buscar status:", JSON.stringify(statusError, null, 2));
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

  const usuariosComNotas = usersData.filter(u => u.totalNotas > 0);
  const mediaGeral = usuariosComNotas.length > 0 
    ? usuariosComNotas.reduce((acc, u) => acc + u.media, 0) / usuariosComNotas.length 
    : 0;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-lg text-accent"><Users size={24} /></div>
          <div>
            <p className="text-sm text-muted">Total de Usuários</p>
            <p className="text-2xl font-bold text-text">{users?.length || 0}</p>
          </div>
        </div>
        
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500"><Star size={24} /></div>
          <div>
            <p className="text-sm text-muted">Média de Notas (Geral)</p>
            <p className="text-2xl font-bold text-text">
              {mediaGeral > 0 ? mediaGeral.toFixed(1) : '0.0'}
            </p>
          </div>
        </div>
        
        <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><MessageSquare size={24} /></div>
          <div>
            <p className="text-sm text-muted">Animes Marcados</p>
            <p className="text-2xl font-bold text-text">{allStatus?.length || 0}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-text mb-4">Todos os Usuários</h2>
      <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-bg border-b border-border text-muted">
            <tr><th className="p-4 font-medium">Usuário</th><th className="p-4 font-medium">Assistindo</th><th className="p-4 font-medium">Concluído</th><th className="p-4 font-medium">Quero Assistir</th><th className="p-4 font-medium">Média</th><th className="p-4 font-medium text-center">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usersData.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted">Nenhum usuário encontrado.</td></tr>
            ) : (
              usersData.map((u: any) => (
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
                  <td className="p-4 text-center">
                    <BotaoNotificar userId={u.id} username={u.username || 'Usuário'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}