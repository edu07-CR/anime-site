import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE() {
  console.log("🚀 [API Delete] Iniciando processo de exclusão...");

  try {
    // 1. Verifica o usuário logado
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("🚨 [API Delete] Erro de autenticação: Usuário não encontrado ou sessão inválida.");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log(`✅ [API Delete] Usuário autenticado: ${user.id}. Preparando para deletar...`);

    // 2. Verifica se a chave secreta existe
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("🚨 [API Delete] ERRO GRAVE: A chave SUPABASE_SERVICE_ROLE_KEY não foi encontrada no .env.local");
      return NextResponse.json({ error: 'Erro de configuração no servidor' }, { status: 500 });
    }

    // 3. Cria o cliente Admin
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // 4. Deleta o usuário
    console.log("⏳ [API Delete] Solicitando exclusão ao Supabase...");
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("🚨 [API Delete] Erro retornado pelo Supabase ao deletar:", deleteError);
      throw deleteError;
    }

    console.log("✅ [API Delete] Usuário deletado com sucesso do banco!");
    
    // 5. Desloga o usuário
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🚨 [API Delete] Erro fatal no bloco Catch:", error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}