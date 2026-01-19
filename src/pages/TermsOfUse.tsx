import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useEffect } from 'react'

export default function TermsOfUse() {
  const { logoUrl, fetchSettings } = useSiteSettingsStore()

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 relative flex items-center justify-center rounded-full overflow-hidden bg-background border border-border/20 p-0 shadow-sm">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <ShieldCheck className="h-5 w-5 text-primary" />
              )}
            </div>
            <span className="text-primary">Templários da Paz</span>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Termos de Uso</h1>
          
          <p className="text-foreground mb-8">
            <strong className="text-foreground">Última atualização:</strong>{' '}
            <span className="text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Aceitação dos Termos</h2>
            <p className="mb-4 text-foreground">
              Ao acessar e utilizar o site da Augusta e Respeitável Loja Simbólica Templários da 
              Paz ("Site"), você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não deve utilizar nosso Site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Uso do Site</h2>
            <p className="mb-4 text-foreground">Você concorda em utilizar o Site apenas para fins legítimos e de 
            acordo com estes Termos. Você se compromete a:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">Fornecer informações precisas e atualizadas ao criar uma conta</li>
              <li className="text-foreground">Manter a confidencialidade de suas credenciais de acesso</li>
              <li className="text-foreground">Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
              <li className="text-foreground">Não utilizar o Site para atividades ilegais ou não autorizadas</li>
              <li className="text-foreground">Não interferir ou interromper o funcionamento do Site</li>
              <li className="text-foreground">Não tentar acessar áreas restritas sem autorização</li>
              <li className="text-foreground">Respeitar os direitos de propriedade intelectual e outros direitos legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Conta de Usuário</h2>
            <p className="mb-4 text-foreground">
              Para acessar certas funcionalidades do Site, você pode precisar criar uma conta. 
              Você é responsável por:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">Manter a segurança de sua conta e senha</li>
              <li className="text-foreground">Todas as atividades que ocorrem sob sua conta</li>
              <li className="text-foreground">Notificar-nos imediatamente sobre qualquer violação de segurança</li>
            </ul>
            <p className="mb-4 text-foreground">
              Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos ou 
              que sejam usadas de forma inadequada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Conteúdo do Site</h2>
            <p className="mb-4 text-foreground">
              O conteúdo do Site, incluindo textos, gráficos, logos, imagens e software, é 
              propriedade da Loja ou de seus licenciadores e está protegido por leis de direitos 
              autorais e outras leis de propriedade intelectual.
            </p>
            <p className="mb-4 text-foreground">
              Você não pode reproduzir, distribuir, modificar, criar trabalhos derivados, 
              exibir publicamente ou usar comercialmente qualquer conteúdo do Site sem nossa 
              autorização prévia por escrito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Conteúdo do Usuário</h2>
            <p className="mb-4 text-foreground">
              Ao enviar conteúdo para o Site (incluindo mensagens, comentários, documentos ou 
              outros materiais), você nos concede uma licença não exclusiva, livre de royalties, 
              perpétua e mundial para usar, reproduzir, modificar e distribuir esse conteúdo.
            </p>
            <p className="mb-4 text-foreground">Você garante que:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">Possui todos os direitos necessários sobre o conteúdo enviado</li>
              <li className="text-foreground">O conteúdo não viola direitos de terceiros</li>
              <li className="text-foreground">O conteúdo não é difamatório, ofensivo ou ilegal</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Área Restrita</h2>
            <p className="mb-4 text-foreground">
              O acesso à área restrita do Site é exclusivo para membros aprovados da Loja. 
              Informações e materiais disponíveis na área restrita são confidenciais e destinados 
              apenas para uso interno da Loja.
            </p>
            <p className="mb-4 text-foreground">
              Você concorda em manter a confidencialidade de todas as informações acessadas na 
              área restrita e não divulgá-las a terceiros sem autorização expressa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Limitação de Responsabilidade</h2>
            <p className="mb-4 text-foreground">
              O Site é fornecido "como está" e "conforme disponível". Não garantimos que o Site 
              estará sempre disponível, livre de erros ou atenderá a todas as suas necessidades.
            </p>
            <p className="mb-4 text-foreground">
              Na medida máxima permitida por lei, a Loja não será responsável por quaisquer 
              danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do 
              uso ou incapacidade de usar o Site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Indenização</h2>
            <p className="mb-4 text-foreground">
              Você concorda em indenizar e isentar a Loja, seus membros, diretores e agentes de 
              quaisquer reivindicações, danos, obrigações, perdas, responsabilidades, custos ou 
              dívidas, e despesas (incluindo honorários advocatícios) decorrentes de:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">Seu uso do Site</li>
              <li className="text-foreground">Violação destes Termos</li>
              <li className="text-foreground">Violação de qualquer direito de terceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Modificações dos Termos</h2>
            <p className="mb-4 text-foreground">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações 
              entrarão em vigor imediatamente após a publicação no Site. Seu uso continuado do Site 
              após as alterações constitui sua aceitação dos novos Termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Lei Aplicável</h2>
            <p className="mb-4 text-foreground">
              Estes Termos serão regidos e interpretados de acordo com as leis da República 
              Federativa do Brasil, sem considerar seus conflitos de disposições legais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Contato</h2>
            <p className="mb-4 text-foreground">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através 
              dos canais disponíveis em nossa página de contato.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
