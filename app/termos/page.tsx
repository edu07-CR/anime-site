import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function TermosPage() {
  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors mb-8 text-sm font-medium">
        <ArrowLeft size={16} /> Voltar para a Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Scale className="text-accent" size={32} />
        <h1 className="text-3xl font-bold text-text">Termos de Uso</h1>
      </div>

      <div className="prose prose-invert max-w-none text-muted space-y-6">
        <p className="text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar o AniVerse, você concorda com estes Termos de Uso. Se você não concordar com alguma parte, por favor, não utilize o site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">2. Uso do Site</h2>
          <p>
            O AniVerse é um site de catalogação e discussão de animes. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades que ocorrem na sua conta. É proibido usar o site para fins ilegais ou para postar conteúdo ofensivo (nos comentários).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">3. Propriedade Intelectual e Direitos Autorais</h2>
          <p>
            As imagens, capas e sinopses dos animes são de propriedade de seus respectivos estúdios e licenciantes. O AniVerse não reivindica a propriedade desse conteúdo, exibindo-o apenas para fins informativos e de crítica (Fair Use).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">4. Limitação de Responsabilidade</h2>
          <p>
            O AniVerse não se responsabiliza por eventuais imprecisões nas informações dos animes (já que são puxadas de APIs externas) ou por indisponibilidade temporária do serviço.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">5. Modificações</h2>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso contínuo do site após as alterações constitui aceitação dos novos termos.
          </p>
        </section>
      </div>
    </div>
  );
}