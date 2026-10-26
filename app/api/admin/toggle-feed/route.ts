import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  
  // Verifica se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Pega o valor que o botão enviou (true ou false)
  const { enabled } = await req.json();

  // Salva no banco
  const { error } = await supabase
    .from('site_config')
    .update({ feed_enabled: enabled })
    .eq('id', 1); 

  if (error) {
    console.error("Erro no banco:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}