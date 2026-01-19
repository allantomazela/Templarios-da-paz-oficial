import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useEffect } from 'react'

export default function Privacy() {
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
          <h1 className="text-4xl font-bold mb-8 text-foreground">Política de Privacidade</h1>
          
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
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introdução</h2>
            <p className="mb-4 text-foreground">
              A Augusta e Respeitável Loja Simbólica Templários da Paz ("nós", "nosso" ou "Loja") 
              respeita sua privacidade e está comprometida em proteger seus dados pessoais. Esta 
              política de privacidade explica como coletamos, usamos, armazenamos e protegemos 
              suas informações quando você utiliza nosso site e serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Informações que Coletamos</h2>
            <p className="mb-4 text-foreground">Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">
                <strong className="text-foreground">Informações de identificação:</strong> Nome completo, e-mail, telefone, 
                endereço e outras informações fornecidas durante o cadastro.
              </li>
              <li className="text-foreground">
                <strong className="text-foreground">Informações de autenticação:</strong> Credenciais de login e senhas 
                criptografadas.
              </li>
              <li className="text-foreground">
                <strong className="text-foreground">Informações de uso:</strong> Dados sobre como você interage com nosso 
                site, incluindo páginas visitadas, tempo de permanência e ações realizadas.
              </li>
              <li className="text-foreground">
                <strong className="text-foreground">Informações técnicas:</strong> Endereço IP, tipo de navegador, sistema 
                operacional e outras informações técnicas coletadas automaticamente.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Como Usamos suas Informações</h2>
            <p className="mb-4 text-foreground">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">Fornecer e melhorar nossos serviços</li>
              <li className="text-foreground">Gerenciar sua conta e autenticação</li>
              <li className="text-foreground">Enviar comunicações importantes sobre a Loja</li>
              <li className="text-foreground">Cumprir obrigações legais e regulatórias</li>
              <li className="text-foreground">Garantir a segurança e prevenir fraudes</li>
              <li className="text-foreground">Realizar análises e melhorias em nossos serviços</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Compartilhamento de Informações</h2>
            <p className="mb-4 text-foreground">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
              exceto nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">Quando necessário para cumprir obrigações legais</li>
              <li className="text-foreground">Com seu consentimento explícito</li>
              <li className="text-foreground">Para proteger nossos direitos e segurança</li>
              <li className="text-foreground">Com prestadores de serviços confiáveis que nos auxiliam na operação do site 
                  (sob acordos de confidencialidade)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Segurança dos Dados</h2>
            <p className="mb-4 text-foreground">
              Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger 
              suas informações contra acesso não autorizado, alteração, divulgação ou destruição. 
              Isso inclui:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">Criptografia de dados sensíveis</li>
              <li className="text-foreground">Controles de acesso baseados em funções</li>
              <li className="text-foreground">Monitoramento regular de segurança</li>
              <li className="text-foreground">Backups regulares dos dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Seus Direitos</h2>
            <p className="mb-4 text-foreground">Você tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-foreground">
              <li className="text-foreground">Acessar suas informações pessoais</li>
              <li className="text-foreground">Corrigir dados incorretos ou incompletos</li>
              <li className="text-foreground">Solicitar a exclusão de seus dados (quando aplicável)</li>
              <li className="text-foreground">Opor-se ao processamento de seus dados</li>
              <li className="text-foreground">Solicitar a portabilidade de seus dados</li>
              <li className="text-foreground">Retirar seu consentimento a qualquer momento</li>
            </ul>
            <p className="mb-4 text-foreground">
              Para exercer esses direitos, entre em contato conosco através dos canais indicados 
              na seção de contato.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Retenção de Dados</h2>
            <p className="mb-4 text-foreground">
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os 
              propósitos descritos nesta política, a menos que um período de retenção mais longo 
              seja exigido ou permitido por lei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Cookies e Tecnologias Similares</h2>
            <p className="mb-4 text-foreground">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar 
              o uso do site e personalizar conteúdo. Você pode gerenciar suas preferências de 
              cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Alterações nesta Política</h2>
            <p className="mb-4 text-foreground">
              Podemos atualizar esta política de privacidade periodicamente. Notificaremos você 
              sobre mudanças significativas publicando a nova política nesta página e atualizando 
              a data de "Última atualização".
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Contato</h2>
            <p className="mb-4 text-foreground">
              Se você tiver dúvidas ou preocupações sobre esta política de privacidade ou sobre 
              como tratamos suas informações pessoais, entre em contato conosco através dos 
              canais disponíveis em nossa página de contato.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
