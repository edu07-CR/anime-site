import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors mb-8 text-sm font-medium">
        <ArrowLeft size={16} /> Voltar para a Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-accent" size={32} />
        <h1 className="text-3xl font-bold text-text">Política de Privacidade</h1>
      </div>

      <div className="prose prose-invert max-w-none text-muted space-y-6">
        <p className="text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">1. Informações que Coletamos</h2>
          <p>
            O AniVerse coleta apenas as informações necessárias para o funcionamento do site. Ao criar uma conta, armazenamos seu e-mail, nome de usuário e senha criptografada (via Supabase). Também armazenamos suas preferências, como animes marcados e notas dadas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">2. Como Usamos suas Informações</h2>
          <p>
            Usamos seus dados para personalizar sua experiência (ex: mostrar suas listas de animes), salvar seu Top 5 e permitir que você participe da comunidade (comentários). Nós não vendemos seus dados para terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">3. Cookies e Anúncios</h2>
          <p>
            Utilizamos cookies para manter sua sessão ativa. Além disso, o AniVerse pode exibir anúncios de redes parceiras (como a Monetag). Essas redes podem usar cookies para exibir anúncios relevantes com base em suas visitas anteriores.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">4. Seus Direitos</h2>
          <p>
            Você pode, a qualquer momento, excluir sua conta diretamente nas configurações do seu perfil. Ao fazer isso, todos os seus dados (listas, notas e perfil) são permanentemente apagados dos nossos servidores.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">5. Contato</h2>
          <p>
            Se tiver dúvidas sobre esta política, entre em contato pelo e-mail: <strong>contato@aniverse.com</strong> (substitua pelo seu e-mail real).
          </p>
        </section>
      </div>
    </div>
  );
}