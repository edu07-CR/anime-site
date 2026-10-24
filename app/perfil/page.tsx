import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { SelecionarAvatar } from '@/components/perfil/SelecionarAvatar';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Busca o username E o avatar_url no banco
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const nomeExibicao = profile?.username || user.email;

  return (
    <div className="w-full">
      {/* CABEÇALHO DO PERFIL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        
        {/* Lado Esquerdo: Avatar + Nome */}
        <div className="flex items-center gap-5">
          {/* Componente que permite trocar o avatar */}
          <SelecionarAvatar avatarAtual={profile?.avatar_url || ''} />
          
          <div>
            <h1 className="text-3xl font-bold text-text">Meu Perfil</h1>
            <p className="text-muted mt-1">
              Bem-vindo, <span className="text-accent font-bold">{nomeExibicao}</span>
            </p>
          </div>
        </div>
        
        {/* Lado Direito: Botão de Configurações */}
        <Link 
          href="/perfil/configuracoes" 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border text-text rounded-lg hover:border-accent hover:text-accent transition-colors font-medium text-sm cursor-pointer w-fit"
        >
          <Settings size={18} />
          Configurações
        </Link>
      </div>
      
      {/* ÁREA EM CONSTRUÇÃO (PARTE 7) */}
      <div className="mt-8 p-12 border border-border border-dashed rounded-xl flex flex-col items-center justify-center text-muted bg-surface/50">
        <span className="text-4xl mb-4">📊</span>
        <h2 className="text-lg font-bold text-text mb-1">Estatísticas em breve</h2>
        <p className="text-sm text-center max-w-md">
          Aqui você poderá ver quantos animes já assistiu, sua média de notas e todas as suas listas organizadas.
        </p>
      </div>
    </div>
  );
}