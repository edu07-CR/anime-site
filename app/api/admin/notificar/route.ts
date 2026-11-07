import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/check-admin';

export async function POST(req: Request) {
  try {
    // 1. Barreira de segurança usando nossa função utilitária
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const { userId, title, message } = await req.json();

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 2. Cliente Admin para inserir a notificação (ignora RLS)
    const supabaseAdmin = createClient(
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