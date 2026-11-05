import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquareWarning } from 'lucide-react';
import { CardFeedback } from '@/components/admin/CardFeedback';

export default async function FeedbacksPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: feedbacks } = await supabaseAdmin
    .from('feedbacks')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquareWarning className="text-purple-500" size={24} />
        <h2 className="text-2xl font-bold text-text">Feedbacks e Sugestões</h2>
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