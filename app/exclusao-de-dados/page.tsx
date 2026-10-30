import Link from 'next/link';
import { ArrowLeft, Trash2, ShieldAlert } from 'lucide-react';

export default function ExclusaoDadosPage() {
  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4">
      <Link href="/" className="text-muted hover:text-accent flex items-center gap-2 mb-8 transition-colors">
        <ArrowLeft size={16} /> Voltar para a Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="text-accent" size={32} />
        <h1 className="text-3xl font-bold text-text">Exclusão de Dados do Usuário</h1>
      </div>

      <div className="prose prose-invert max-w-none text-text space-y-6">
        <p className="text-muted">
          No <strong>AniVerse</strong>, levamos a sua privacidade a sério. Se você deseja excluir permanentemente a sua conta e todos os dados associados a ela, você pode fazer isso de duas formas:
        </p>

        <div className="bg-surface border border-border p-6 rounded-xl">
          <h2 className="text-xl font-bold text-text mb-3 flex items-center gap-2">
            <Trash2 className="text-red-400" size={20} /> Opção 1: Exclusão Direta no Site (Recomendado)
          </h2>
          <p className="text-muted mb-4">
            A forma mais rápida de excluir tudo é fazer login no site e ir até a página de configurações do seu perfil. Lá, você encontrará o botão <strong>"Deletar Conta"</strong>. Ao confirmar, todos os seus dados (animes salvos, Top 10, comentários, curtidas e notificações) serão apagados imediatamente dos nossos servidores.
          </p>
          <Link 
            href="/perfil/configuracoes" 
            className="inline-block bg-accent text-white font-bold px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Ir para Configurações do Perfil
          </Link>
        </div>

        <div className="bg-surface border border-border p-6 rounded-xl">
          <h2 className="text-xl font-bold text-text mb-3">Opção 2: Solicitação por E-mail</h2>
          <p className="text-muted mb-4">
            Se você não consegue acessar a sua conta, pode solicitar a exclusão dos seus dados entrando em contato conosco por e-mail. Responderemos em até 7 dias úteis para confirmar a exclusão.
          </p>
          <p className="text-muted">
            Envie um e-mail para: <a href="mailto:carlos.eduardo.c.r@outlook.com" className="text-accent hover:underline">carlos.eduardo.c.r@outlook.com</a>
          </p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-xl">
          <h2 className="text-xl font-bold text-text mb-3">Quais dados são excluídos?</h2>
          <ul className="list-disc pl-5 text-muted space-y-2">
            <li>Seu perfil público (nome de usuário, avatar e bio).</li>
            <li>Sua lista de animes (Assistindo, Quero Ver, Concluído).</li>
            <li>Seu ranking do Top 10.</li>
            <li>Suas curtidas, comentários e mensagens no chat.</li>
            <li>Seu histórico de notificações.</li>
          </ul>
          <p className="text-xs text-muted mt-4">
            * Os dados de autenticação (e-mail e senha) são gerenciados pelo Supabase Auth e também são removidos permanentemente.
          </p>
        </div>
      </div>
    </div>
  );
}