import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, X, Lock } from 'lucide-react'
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
import { HERO_CARD_DEFAULT_BACKGROUND_URL } from '@/lib/hero-card-defaults'
import { BrandLogoImg } from '@/components/brand/BrandLogoImg'

export default function Index() {
  const { isAuthenticated } = useAuthStore()
  const {
    logoUrl,
    homeBannerUrl,
    heroCardBgUrl,
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
  const [heroCardBgLoadFailed, setHeroCardBgLoadFailed] = useState(false)

  const heroCardBgCustom = heroCardBgUrl?.trim() ?? ''

  useEffect(() => {
    setHeroCardBgLoadFailed(false)
  }, [heroCardBgCustom])

  const heroCardBgSrc =
    heroCardBgCustom && !heroCardBgLoadFailed
      ? heroCardBgCustom
      : HERO_CARD_DEFAULT_BACKGROUND_URL

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
    'rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground'

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 bg-background/70 shadow-sm shadow-black/5 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-full items-center gap-4 px-4 md:px-6">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-0 text-left transition-opacity hover:opacity-90 md:flex-initial md:gap-2.5"
            aria-label="Ir para o início"
          >
            <SiteLogoAvatar logoUrl={logoUrl} placement="header" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground sm:flex-initial sm:text-base sm:max-w-[10rem] md:max-w-none">
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

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button
              onClick={handleMemberAccess}
              size="sm"
              variant="default"
              className="hidden shadow-sm shadow-primary/20 sm:inline-flex"
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
            <Button
              onClick={handleMemberAccess}
              variant="default"
              className="mt-3 w-full rounded-xl shadow-md shadow-primary/20"
              size="lg"
            >
              <Lock className="mr-2 h-4 w-4" />
              Área do Membro
            </Button>
          </nav>
        </div>
      </header>

      <div id="home" className="scroll-mt-20 pt-16">
        {/* Faixa visual: imagem das configurações ou faixa gradiente padrão (sempre algo abaixo do header) */}
        {homeBannerUrl ? (
          <div className="relative w-full overflow-hidden border-b border-border/30 bg-muted/20">
            <img
              src={homeBannerUrl}
              alt=""
              className="h-auto w-full max-h-[min(42vh,400px)] object-cover object-center sm:max-h-[min(48vh,480px)]"
              loading="eager"
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"
              aria-hidden
            />
          </div>
        ) : (
          <div
            className="relative h-40 w-full overflow-hidden border-b border-border/30 sm:h-48 md:h-56"
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-background to-secondary/20" />
            <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/25 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.25),transparent)]" />
          </div>
        )}

        <section
          className={cn(
            'relative flex flex-col justify-center overflow-hidden',
            homeBannerUrl
              ? 'min-h-[min(72vh,calc(100vh-5rem))] py-12 md:py-16'
              : 'min-h-[calc(100vh-4rem-10rem)] py-14 md:min-h-[calc(100vh-4rem-12rem)] md:py-20',
          )}
        >
          <div className="pointer-events-none absolute inset-0 z-0">
            <img
              src="/placeholder.svg"
              alt=""
              className="h-full w-full object-cover opacity-[0.12] brightness-[0.55]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
            <div className="absolute left-1/2 top-1/3 h-[min(50vw,28rem)] w-[min(50vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="container relative z-10 mx-auto grid flex-1 place-items-center px-4 md:px-6">
            <div className="flex w-full max-w-3xl flex-col items-center text-center md:max-w-4xl">
              <div className="relative w-full min-h-[280px] overflow-hidden rounded-2xl border border-border/50 shadow-xl shadow-black/15">
                <img
                  src={heroCardBgSrc}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="pointer-events-none absolute inset-0 h-full min-h-full w-full scale-105 object-cover opacity-[0.28] saturate-[0.75] contrast-[0.92]"
                  loading="eager"
                  decoding="async"
                  onError={() => {
                    if (heroCardBgCustom) setHeroCardBgLoadFailed(true)
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-background/88"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-primary/[0.04]"
                  aria-hidden
                />
                <div className="relative z-10 p-6 sm:p-8 md:p-10">
                  <div className="mx-auto max-w-2xl rounded-xl border border-border/40 bg-background/55 px-5 py-6 shadow-sm backdrop-blur-md sm:px-7 sm:py-8 md:backdrop-blur-lg">
                  <p className="mb-5 font-oldenglish text-base font-bold leading-snug tracking-wide text-primary sm:text-lg md:text-xl">
                    Augusta e Respeitável Loja Simbólica
                  </p>
                  <h1 className="font-oldenglish text-4xl font-bold leading-tight tracking-tight text-foreground [text-shadow:0_1px_2px_hsl(var(--background)/0.9),0_2px_16px_hsl(var(--background)/0.75)] sm:text-5xl md:text-6xl lg:text-7xl">
                    Templários da Paz 3969
                  </h1>
                  <p
                    className="mt-5 font-oldenglish text-3xl font-bold text-primary [text-shadow:0_1px_2px_hsl(var(--background)/0.85)] sm:text-4xl md:text-5xl"
                    title="Três pontos maçônicos"
                    aria-label="Três pontos maçônicos"
                  >
                    ∴
                  </p>
                  <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                    Trabalhamos pelo aperfeiçoamento moral, intelectual e social da humanidade em{' '}
                    <span className="font-medium text-foreground/90">
                      {contact.city || 'Botucatu-SP'}
                    </span>
                    . Uma irmandade de luz, tradição e serviço à comunidade.
                  </p>
                  <div className="mt-10 flex w-full flex-col items-center gap-4">
                    <Button
                      type="button"
                      size="lg"
                      onClick={() => handleNavClick('quem-somos')}
                      className="h-14 w-full rounded-full px-10 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/25 sm:w-auto sm:min-w-[260px]"
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
            <SiteLogoAvatar logoUrl={logoUrl} placement="footer" />
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

interface SiteLogoAvatarProps {
  logoUrl?: string | null
  placement: 'header' | 'footer'
}

function SiteLogoAvatar({ logoUrl, placement }: SiteLogoAvatarProps) {
  const isHeader = placement === 'header'

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-gradient-to-b shadow-sm',
        isHeader
          ? 'h-[52px] w-[52px] border-border/40 from-primary/[0.09] to-background/95 p-px shadow-black/[0.06] ring-1 ring-primary/15 sm:h-14 sm:w-14'
          : 'h-10 w-10 border-border/35 from-primary/[0.06] to-background/95 p-px ring-1 ring-primary/10 sm:h-11 sm:w-11',
      )}
    >
      <BrandLogoImg
        logoUrl={logoUrl}
        alt=""
        className={cn(
          'h-full w-full origin-center object-contain object-center',
          isHeader ? 'scale-[1.12] sm:scale-[1.1]' : 'scale-[1.08] sm:scale-[1.06]',
        )}
        fallbackClassName={isHeader ? 'h-6 w-6 scale-100' : 'h-4 w-4 scale-100'}
        loading="eager"
        decoding="async"
        sizes={isHeader ? '(max-width: 640px) 52px, 56px' : '(max-width: 640px) 40px, 44px'}
      />
    </div>
  )
}
