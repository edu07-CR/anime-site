// app/admin/layout.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Flag, Users, MessageSquareWarning } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // 1. Pega o usuário logado
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // 2. Verifica se é admin no banco de dados
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  // 3. Se não for admin, chuta pra fora
  if (!profile?.is_admin) {
    redirect('/'); // Ou poderia ser uma página de erro 403/not-found
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      
      {/* Cabeçalho Fixo do Admin */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-accent" size={32} />
          <h1 className="text-3xl font-bold text-text">Painel de Administração</h1>
        </div>
        <Link href="/" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Voltar para a Home
        </Link>
      </div>

      {/* Menu de Navegação entre as páginas do Admin */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-border pb-4">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-text/60 hover:bg-surface-hover hover:text-text transition-colors"
        >
          Visão Geral
        </Link>
        <Link 
          href="/admin/denuncias" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Flag size={16} /> Denúncias
        </Link>
        <Link 
          href="/admin/usuarios" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-blue-500 hover:bg-blue-500/10 transition-colors"
        >
          <Users size={16} /> Usuários
        </Link>
        <Link 
          href="/admin/feedbacks" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-purple-500 hover:bg-purple-500/10 transition-colors"
        >
          <MessageSquareWarning size={16} /> Feedbacks
        </Link>
      </div>

      {/* Aqui é onde o conteúdo de cada página vai aparecer */}
      <div>{children}</div>
      
    </div>
  );
}