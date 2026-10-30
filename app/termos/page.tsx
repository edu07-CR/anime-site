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
            Ao acessar e usar o AniVerse, você concorda com estes Termos de Uso. Se você não concordar com alguma parte, por favor, não utilize o site. Ao criar uma conta, você declara que leu e aceita integralmente estas regras.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">2. Requisitos de Idade</h2>
          <p>
            O AniVerse é um site de entretenimento voltado para fãs de anime de todas as idades. Menores de 18 anos devem utilizar o site com supervisão de seus pais ou responsáveis legais. Ao criar uma conta, você declara que possui capacidade legal ou autorização para tanto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">3. Conta do Usuário</h2>
          <p>
            Você é responsável por manter a confidencialidade da sua senha e por todas as atividades que ocorrem na sua conta. O AniVerse não se responsabiliza por perdas causadas pelo uso não autorizado da sua conta. Você pode excluir sua conta a qualquer momento na página de configurações do perfil.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">4. Conteúdo Gerado pelo Usuário</h2>
          <p>
            Você é o único responsável pelo conteúdo que publica no Feed, Chat e Comentários. É proibido publicar conteúdo ilegal, ofensivo, de ódio, spam, pornografia, links maliciosos ou que viole direitos autorais. O AniVerse reserva-se o direito de remover qualquer conteúdo e banir ou suspender usuários que violem estas regras, sem aviso prévio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">5. Licença de Conteúdo</h2>
          <p>
            Você mantém a propriedade do conteúdo que publica (posts, comentários, mensagens). No entanto, ao publicá-lo no AniVerse, você nos concede uma licença gratuita, não exclusiva e mundial para exibir, armazenar e distribuir esse conteúdo dentro da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">6. Propriedade Intelectual e Direitos Autorais</h2>
          <p>
            As imagens, capas e sinopses dos animes são de propriedade de seus respectivos estúdios e licenciantes. O AniVerse não reivindica a propriedade desse conteúdo, exibindo-o apenas para fins informativos e de crítica (Fair Use).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">7. Links de Afiliados</h2>
          <p>
            O AniVerse pode conter links de afiliados em seu conteúdo. Isso significa que podemos receber uma comissão se você clicar em um link e fizer uma compra ou assinatura. Isso não afeta o preço final que você paga. Os links são para plataformas parceiras, cujos nomes são mantidos em sigilo contratual.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">8. Limitação de Responsabilidade</h2>
          <p>
            O AniVerse não se responsabiliza por: (a) eventuais imprecisões nas informações dos animes (já que são puxadas de APIs externas); (b) indisponibilidade temporária do serviço; (c) conteúdo publicado por outros usuários; (d) links externos, incluindo links de afiliados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">9. Modificações dos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor assim que publicadas no site. O uso contínuo do site após as alterações constitui aceitação dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">10. Foro e Jurisdição</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para resolver quaisquer disputas.
          </p>
        </section>
      </div>
    </div>
  );
}