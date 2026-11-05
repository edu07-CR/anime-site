import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Flag, Trash2, ExternalLink } from 'lucide-react';

interface Denuncia {
  id: string;
  post_id: string;
  reporter_username: string;
  reason: string;
  post_caption: string | null;
  post_user_username: string;
}

export default async function DenunciasPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: denuncias } = await supabaseAdmin.rpc('get_denuncias_posts');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Flag className="text-red-500" size={24} />
        <h2 className="text-2xl font-bold text-text">Denúncias de Posts</h2>
      </div>
      
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {denuncias?.length === 0 ? (
          <p className="p-6 text-muted text-sm">Nenhuma denúncia pendente.</p>
        ) : (
          <div className="divide-y divide-border">
            {denuncias?.map((d: Denuncia) => (
              <div key={d.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-text">
                    <strong className="text-red-500">@{d.reporter_username}</strong> denunciou o post de <strong className="text-text">@{d.post_user_username}</strong>
                  </p>
                  <p className="text-xs text-muted mt-1">Motivo: <span className="text-text">{d.reason}</span></p>
                  <p className="text-xs text-muted mt-1">Conteúdo: <span className="italic">"{d.post_caption || '(Sem texto)'}"</span></p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/feed/${d.post_id}`} target="_blank" className="flex items-center gap-1 text-sm text-blue-500 hover:underline px-2 py-1">
                    <ExternalLink size={14} /> Ver Post
                  </Link>
                  <form action={async () => {
                    'use server';
                    const s = await createServerClient();
                    await s.from('post_reports').delete().eq('id', d.id);
                    redirect('/admin/denuncias');
                  }}>
                    <button type="submit" className="text-sm text-muted hover:text-text border border-border px-3 py-1 rounded-lg hover:bg-bg">Ignorar</button>
                  </form>
                  <form action={async () => {
                    'use server';
                    const s = await createServerClient();
                    await s.from('posts').delete().eq('id', d.post_id);
                    await s.from('post_reports').delete().eq('post_id', d.post_id);
                    redirect('/admin/denuncias');
                  }}>
                    <button type="submit" className="flex items-center gap-1 text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg">
                      <Trash2 size={14} /> Deletar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}