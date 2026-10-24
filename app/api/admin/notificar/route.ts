import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { userId, title, message } = await req.json();

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Verifica quem está chamando a API (precisa ser Admin)
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    // 2. Cliente Admin para inserir a notificação (ignora RLS)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3. Insere a notificação
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        message: message,
        is_read: false
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao enviar notificação:", error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}