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
import {
  BrandLogoImg,
  BRAND_LOGO_INTRINSIC_SIZE,
} from '@/components/brand/BrandLogoImg'

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
    'rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground antialiased">
      <header className="fixed left-0 right-0 top-0 z-50 min-h-16 border-b border-border/50 bg-background/75 shadow-sm shadow-black/[0.07] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/65">
        <div className="container mx-auto flex min-h-16 items-center gap-3 px-4 py-2 md:gap-4 md:px-6 md:py-0">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-0.5 text-left transition-opacity hover:opacity-90 md:flex-initial md:gap-3"
            aria-label="Ir para o início"
          >
            <SiteLogoAvatar logoUrl={logoUrl} placement="header" />
            <div className="min-w-0 flex-1 md:flex-initial">
              <span className="block truncate text-sm font-semibold leading-tight text-foreground sm:text-base">
                Templários da Paz
              </span>
              <span className="mt-0.5 block text-[9px] font-medium uppercase leading-snug tracking-[0.12em] text-muted-foreground sm:text-[10px] sm:leading-tight sm:tracking-[0.14em] md:text-[11px]">
                <span className="block sm:inline">ARLS n.º 3969</span>
                <span className="hidden sm:inline"> · </span>
                <span className="block sm:inline">Oriente de Botucatu – SP</span>
              </span>
            </div>
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
            'md:hidden absolute inset-x-0 top-full z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl shadow-lg transition-all duration-300 ease-in-out',
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
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('quem-somos')}
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Sobre
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('pilares')}
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Serviços
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
          <div className="w-full border-b border-border/40 bg-muted/25">
            <div className="container px-4 md:px-6">
              <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-b-2xl shadow-md ring-1 ring-border/30">
              <img
                src={homeBannerUrl}
                alt=""
                className="h-auto w-full max-h-[min(46vh,460px)] object-cover object-center"
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
            </div>
          </div>
        ) : (
          <div className="w-full border-b border-border/40 bg-muted/25">
            <div className="container px-4 md:px-6">
              <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-b-2xl shadow-md ring-1 ring-border/30">
                <div
                  className="relative h-40 w-full overflow-hidden sm:h-48 md:h-56"
                  aria-hidden
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.22] via-background to-secondary/25" />
                  <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-primary/18 blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,hsl(var(--primary)/0.28),transparent)]" />
                </div>
              </div>
            </div>
          </div>
        )}

        <section
          className={cn(
            'relative flex flex-col justify-center overflow-hidden',
            homeBannerUrl
              ? 'min-h-[min(70vh,calc(100vh-5.5rem))] py-10 sm:py-12 md:min-h-[min(72vh,calc(100vh-5rem))] md:py-16'
              : 'min-h-[calc(100vh-4.5rem-10rem)] py-12 sm:py-14 md:min-h-[calc(100vh-4rem-12rem)] md:py-20',
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
              <div className="relative w-full min-h-[min(52vh,320px)] overflow-hidden rounded-3xl border border-primary/15 bg-card/30 shadow-2xl shadow-black/25 ring-1 ring-border/40 sm:min-h-[280px] md:min-h-[300px]">
                <img
                  src={heroCardBgSrc}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="pointer-events-none absolute inset-0 h-full min-h-full w-full scale-105 object-cover opacity-[0.26] saturate-[0.72] contrast-[0.9]"
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
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/[0.97] via-background/90 to-background/[0.96]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-primary/[0.035]"
                  aria-hidden
                />
                <div className="relative z-10 p-5 sm:p-8 md:p-11">
                  <div className="mx-auto max-w-2xl rounded-2xl border border-primary/12 bg-background/50 px-4 py-6 shadow-inner backdrop-blur-md sm:px-8 sm:py-9 md:backdrop-blur-lg">
                  <p className="mb-3 font-oldenglish text-base font-bold leading-snug tracking-wide text-primary sm:mb-5 sm:text-lg md:text-xl">
                    Augusta e Respeitável Loja Simbólica
                  </p>
                  <h1 className="font-oldenglish text-[clamp(1.75rem,6.5vw,2.25rem)] font-bold leading-[1.08] tracking-tight text-foreground [text-shadow:0_1px_2px_hsl(var(--background)/0.9),0_2px_20px_hsl(var(--background)/0.7)] sm:text-5xl md:text-6xl lg:text-7xl">
                    Templários da Paz 3969
                  </h1>
                  <p className="mx-auto mt-3 max-w-md font-sans text-[11px] font-semibold uppercase leading-snug tracking-[0.16em] text-primary/85 sm:mt-4 sm:text-sm sm:tracking-[0.18em]">
                    Oriente de Botucatu — São Paulo — Brasil
                  </p>
                  <p
                    className="mt-3 font-oldenglish text-[clamp(1.75rem,5vw,1.875rem)] font-bold text-primary [text-shadow:0_1px_2px_hsl(var(--background)/0.85)] sm:mt-5 sm:text-4xl md:text-5xl"
                    title="Três pontos maçônicos"
                    aria-label="Três pontos maçônicos"
                  >
                    ∴
                  </p>
                  <p className="mx-auto mt-5 max-w-xl text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
                    Trabalhamos pelo aperfeiçoamento moral, intelectual e social da humanidade em{' '}
                    <span className="font-medium text-foreground/90">
                      {contact.city || 'Botucatu-SP'}
                    </span>
                    . Uma irmandade de luz, tradição e serviço à comunidade.
                  </p>
                  <div className="mt-8 flex w-full flex-col items-center gap-3 sm:mt-10 sm:gap-4">
                    <Button
                      type="button"
                      size="lg"
                      onClick={() => handleNavClick('quem-somos')}
                      className="h-14 w-full rounded-full px-10 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/35 sm:w-auto sm:min-w-[260px]"
                    >
                      Conheça nossa história
                    </Button>
                    <button
                      type="button"
                      onClick={handleMemberAccess}
                      className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
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
      <footer className="border-t border-border/50 bg-gradient-to-b from-muted/90 to-muted py-10 text-muted-foreground md:py-12">
        <div className="container mx-auto max-w-4xl px-4 text-center md:px-6">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
            <SiteLogoAvatar logoUrl={logoUrl} placement="footer" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">
                Templários da Paz
              </p>
              <p className="text-sm font-medium text-primary/90">
                ARLS n.º 3969 · R.·. L.·. S.·.
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Oriente de Botucatu · São Paulo · Brasil
              </p>
            </div>
          </div>
          <div
            className="mx-auto my-8 h-px max-w-xs bg-gradient-to-r from-transparent via-border to-transparent"
            aria-hidden
          />
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed">
            © {new Date().getFullYear()} ARLS Templários da Paz n.º 3969. Todos os
            direitos reservados.
          </p>
          <div className="mb-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
            <Link
              to="/privacy"
              className="rounded-sm text-foreground/90 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Privacidade
            </Link>
            <Link
              to="/terms"
              className="rounded-sm text-foreground/90 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Termos de Uso
            </Link>
            <Link
              to="/login"
              className="rounded-sm text-foreground/90 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Área Restrita
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/75">
            Desenvolvido por{' '}
            <span className="font-medium text-foreground/90">
              Allan Tomazela de Camargo
            </span>
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
        width={BRAND_LOGO_INTRINSIC_SIZE}
        height={BRAND_LOGO_INTRINSIC_SIZE}
        fetchPriority={isHeader ? 'high' : 'low'}
      />
    </div>
  )
}
