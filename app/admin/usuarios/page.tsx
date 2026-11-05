import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { BotaoNotificar } from '@/components/admin/BotaoNotificar';

export default async function UsuariosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: users } = await supabaseAdmin.from('profiles').select('id, username, avatar_url, created_at').order('created_at', { ascending: false });
  const { data: allStatus } = await supabaseAdmin.from('user_anime').select('user_id, status, rating');

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
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-blue-500" size={24} />
        <h2 className="text-2xl font-bold text-text">Todos os Usuários</h2>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto">
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
    </div>
  );
}