import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { DeletarConta } from '@/components/perfil/DeletarConta';

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      
      <Link href="/perfil" className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors mb-8 text-sm font-medium cursor-pointer">
        <ArrowLeft size={16} /> Voltar para o Perfil
      </Link>

      <h1 className="text-3xl font-bold text-text mb-2">Configurações da Conta</h1>
      <p className="text-muted mb-8">Gerencie seus dados e preferências.</p>

      <div className="bg-surface border border-border rounded-xl p-6 md:p-8 mb-8">
        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          Informações Básicas
        </h2>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">E-mail cadastrado:</p>
          <p className="text-text font-medium bg-bg px-4 py-3 rounded-lg border border-border w-fit">
            {user.email}
          </p>
        </div>
      </div>

      <div className="border border-red-500/20 rounded-xl p-6 md:p-8 bg-red-500/5">
        <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
          <ShieldAlert size={20} /> Zona de Perigo
        </h2>
        <p className="text-muted text-sm mb-6">
          Ao deletar sua conta, você perderá acesso a todos os seus animes salvos, notas e histórico. 
          Essa ação é irreversível.
        </p>
        
        <DeletarConta />
      </div>

    </div>
  );
}