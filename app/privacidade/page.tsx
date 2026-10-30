import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      <Link href="/" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1 mb-8">
        <ArrowLeft size={16} /> Voltar para a Home
      </Link>

      <h1 className="text-3xl font-bold text-text mb-6">Política de Privacidade</h1>
      <p className="text-muted mb-4">Última atualização: 30 de Outubro de 2026</p>

      <div className="space-y-6 text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-text mb-2">1. Quais dados coletamos?</h2>
          <p>Ao criar uma conta no AniVerse, coletamos: <strong>Nome de usuário, endereço de e-mail, senha (criptografada) e avatar escolhido</strong>. Também coletamos dados de uso (páginas visitadas, animes marcados como "Assistindo", notas e interações no Feed e Chat) para personalizar sua experiência.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">2. Como usamos seus dados?</h2>
          <p>Seus dados são usados para: (a) permitir o login e a gestão da sua conta; (b) salvar suas listas, notas e preferências; (c) exibir seu perfil público para outros usuários; (d) enviar notificações sobre novos episódios dos animes que você acompanha.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">3. Compartilhamento com Terceiros</h2>
          <p>Não vendemos seus dados. No entanto, usamos serviços de terceiros que podem processar dados: <strong>Supabase</strong> (armazenamento do banco de dados e autenticação), <strong>Vercel</strong> (hospedagem) e <strong>AniList/Jikan</strong> (APIs públicas de dados de animes). No futuro, podemos usar redes de anúncios (como Google AdSense) que utilizam cookies para personalizar anúncios.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">4. Cookies</h2>
          <p>Utilizamos cookies para manter sua sessão ativa e para fins de análise de tráfego. Você pode desativar os cookies no seu navegador, mas isso pode afetar o funcionamento do site.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">5. Seus Direitos (LGPD)</h2>
          <p>De acordo com a LGPD, você tem direito a: acessar, corrigir ou excluir seus dados pessoais a qualquer momento. Para exercer esses direitos, entre em contato pelo e-mail: <strong>carlos.eduardo.c.r@outlook.com</strong>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">6. Exclusão de Conta</h2>
          <p>Você pode solicitar a exclusão da sua conta a qualquer momento através da página de configurações do seu perfil. Ao excluir a conta, todos os seus dados (listas, posts, mensagens) serão permanentemente removidos dos nossos servidores.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">7. Foro e Jurisdição</h2>
          <p>Esta política é regida pelas leis da República Federativa do Brasil. Quaisquer disputas serão resolvidas no foro da comarca de São Paulo/SP.</p>
        </section>
      </div>
    </div>
  );
}