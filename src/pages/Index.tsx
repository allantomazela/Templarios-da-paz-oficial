import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Menu, X, Lock } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useState, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { NewsSection } from '@/components/home/NewsSection'
import { HistorySection } from '@/components/home/HistorySection'
import { ValuesSection } from '@/components/home/ValuesSection'
import { VenerablesSection } from '@/components/home/VenerablesSection'
import { ContactSection } from '@/components/home/ContactSection'
import { CustomSection } from '@/components/home/CustomSection'

export default function Index() {
  const { isAuthenticated } = useAuthStore()
  const {
    logoUrl,
    homeBannerUrl,
    history,
    values,
    contact,
    venerables,
    sectionOrder,
    customSections,
    fetchSettings,
    fetchVenerables,
  } = useSiteSettingsStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchVenerables()
  }, [fetchSettings, fetchVenerables])

  // Handle hash scrolling on mount or hash change
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      // Small timeout to allow DOM layout to settle, especially with images
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [location.hash, history, values, venerables, sectionOrder])

  const handleMemberAccess = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      // Update URL hash without causing a page reload/jump
      window.history.pushState(null, '', `#${id}`)
    }
  }

  // Map section keys to components
  const sectionComponents: Record<string, ReactNode> = {
    history: (
      <HistorySection
        key="history"
        title={history.title}
        text={history.text}
        imageUrl={history.imageUrl}
      />
    ),
    values: (
      <ValuesSection
        key="values"
        liberty={values.liberty}
        equality={values.equality}
        fraternity={values.fraternity}
      />
    ),
    venerables: <VenerablesSection key="venerables" venerables={venerables} />,
    news: <NewsSection key="news" />,
    contact: (
      <ContactSection
        key="contact"
        address={contact.address}
        city={contact.city}
        zip={contact.zip}
        email={contact.email}
        secondaryEmail={contact.secondaryEmail}
        phone={contact.phone}
        messageEmail={contact.messageEmail}
      />
    ),
    masters: <VenerablesSection key="masters" venerables={venerables} />,
  }

  const navLinkClass =
    'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200'

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/30 bg-background/65 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/55">
        <div className="container mx-auto flex h-full items-center gap-4 px-4 md:px-6">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex shrink-0 items-center gap-2.5 rounded-md py-1 text-left transition-opacity hover:opacity-90"
            aria-label="Ir para o início"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/30 bg-background/80 shadow-sm">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-full w-full object-contain"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
              )}
            </div>
            <span className="hidden font-semibold text-foreground sm:inline sm:max-w-[10rem] sm:truncate md:max-w-none">
              Templários da Paz
            </span>
          </button>

          <nav
            className="hidden flex-1 items-center justify-center gap-6 lg:gap-10 md:flex"
            aria-label="Principal"
          >
            <button type="button" onClick={() => handleNavClick('home')} className={navLinkClass}>
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('quem-somos')}
              className={navLinkClass}
            >
              Sobre
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('pilares')}
              className={navLinkClass}
            >
              Serviços
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className={navLinkClass}
            >
              Contato
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={handleMemberAccess}
              size="sm"
              variant="secondary"
              className="hidden shadow-sm sm:inline-flex"
            >
              <Lock className="mr-2 h-4 w-4" />
              Área do Membro
            </Button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            'md:hidden fixed inset-x-0 top-16 z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl shadow-lg transition-all duration-300 ease-in-out',
            isMobileMenuOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0 pointer-events-none',
          )}
        >
          <nav
            className="container mx-auto flex flex-col gap-1 px-4 py-4"
            aria-label="Menu mobile"
          >
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('quem-somos')}
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Sobre
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('pilares')}
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Serviços
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Contato
            </button>
            <Button onClick={handleMemberAccess} className="mt-3 w-full rounded-xl" size="lg">
              <Lock className="mr-2 h-4 w-4" />
              Área do Membro
            </Button>
          </nav>
        </div>
      </header>

      <div id="home" className="scroll-mt-20 pt-16">
        {homeBannerUrl ? (
          <div className="relative w-full overflow-hidden border-b border-border/25 bg-muted/30">
            <img
              src={homeBannerUrl}
              alt=""
              className="h-auto w-full max-h-[min(40vh,380px)] object-cover object-center sm:max-h-[min(44vh,440px)]"
              loading="eager"
              decoding="async"
            />
          </div>
        ) : null}

        <section
          className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center overflow-hidden"
        >
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src="/placeholder.svg"
            alt=""
            className="h-full w-full object-cover opacity-25 brightness-[0.45]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        </div>

        <div className="container relative z-10 grid flex-1 place-items-center px-4 py-12 md:px-6 md:py-16">
          <div className="flex max-w-3xl flex-col items-center text-center md:max-w-4xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary md:text-sm">
              Augusta e Respeitável Loja Simbólica
            </p>
            <h1 className="font-sans text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Templários da Paz
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
              Trabalhamos pelo aperfeiçoamento moral, intelectual e social da humanidade em{' '}
              {contact.city || 'Botucatu-SP'}. Uma irmandade de luz, tradição e serviço à comunidade.
            </p>
            <div className="mt-10 flex w-full max-w-md flex-col items-center gap-4 sm:max-w-none">
              <Button
                type="button"
                size="lg"
                onClick={() => handleNavClick('quem-somos')}
                className="h-14 w-full rounded-full px-10 text-base font-semibold shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg sm:w-auto sm:min-w-[240px]"
              >
                Conheça nossa história
              </Button>
              <button
                type="button"
                onClick={handleMemberAccess}
                className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                Acesso para membros
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Dynamic Sections */}
      {(() => {
        // Combinar seções padrão e customizadas, ordenadas
        const allSections: Array<{
          type: 'standard' | 'custom'
          key: string
          order: number
          component?: ReactNode
          customSection?: (typeof customSections)[0]
        }> = []

        // Adicionar seções padrão com ordem baseada no índice
        sectionOrder.forEach((key, index) => {
          const component = sectionComponents[key]
          if (component) {
            allSections.push({
              type: 'standard',
              key,
              order: index,
              component,
            })
          }
        })

        // Adicionar seções customizadas visíveis
        customSections
          .filter((cs) => cs.visible)
          .forEach((cs) => {
            allSections.push({
              type: 'custom',
              key: `custom-${cs.id}`,
              order: cs.order,
              customSection: cs,
            })
          })

        // Ordenar por ordem (seções padrão têm ordem 0, 1, 2... e customizadas podem ter qualquer ordem)
        allSections.sort((a, b) => a.order - b.order)

        // Renderizar
        return allSections.map((section) => {
          if (section.type === 'custom' && section.customSection) {
            return (
              <CustomSection key={section.key} section={section.customSection} />
            )
          }
          if (section.type === 'standard' && section.component) {
            return <div key={section.key}>{section.component}</div>
          }
          return null
        })
      })()}

      {/* Footer */}
      <footer className="py-8 bg-muted text-muted-foreground border-t">
        <div className="container px-4 md:px-6 text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-lg text-foreground mb-4">
            <div className="h-8 w-8 relative flex items-center justify-center rounded-full overflow-hidden bg-background border border-border/10 p-0 shadow-sm">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                  }}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <ShieldCheck className="h-5 w-5 text-primary" />
              )}
            </div>
            <span>Templários da Paz</span>
          </div>
          <p className="text-sm mb-4">
            © {new Date().getFullYear()} ARLS Templários da Paz. Todos os
            direitos reservados.
          </p>
          <div className="flex justify-center gap-6 text-sm mb-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacidade
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Termos de Uso
            </Link>
            <Link to="/login" className="hover:text-primary transition-colors">
              Área Restrita
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-4">
            Desenvolvido por{' '}
            <span className="font-medium text-foreground">Allan Tomazela de Camargo</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
