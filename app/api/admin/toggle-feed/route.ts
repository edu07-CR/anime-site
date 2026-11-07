import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/check-admin';

export async function POST(req: Request) {
  try {
    // 1. Verifica se o usuário logado é um administrador
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    // 2. Lê o valor enviado
    const { enabled } = await req.json();

    // 3. Usa a Service Role Key para ignorar o RLS e garantir a alteração
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabaseAdmin
      .from('site_config')
      .update({ feed_enabled: enabled })
      .eq('id', 1);

    if (error) {
      console.error("Erro no banco:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}