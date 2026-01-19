import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Lock,
} from 'lucide-react'
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl h-full py-2">
            <div className="h-full aspect-square relative flex items-center justify-center rounded-full overflow-hidden bg-background border border-border/20 p-0 shadow-sm">
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
                <ShieldCheck className="h-2/3 w-2/3 text-primary" />
              )}
            </div>
            <span className="text-primary hidden sm:inline-block">
              Templários da Paz
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleNavClick('home')}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => handleNavClick('quem-somos')}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Quem Somos
            </button>
            <button
              onClick={() => handleNavClick('pilares')}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Pilares
            </button>
            {sectionOrder.includes('venerables') && (
              <button
                onClick={() => handleNavClick('veneraveis')}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Galeria dos Veneráveis
              </button>
            )}
            {sectionOrder.includes('news') && (
              <button
                onClick={() => handleNavClick('noticias')}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Notícias
              </button>
            )}
            <button
              onClick={() => handleNavClick('contact')}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Contato
            </button>
            <Button onClick={handleMemberAccess} size="sm" className="ml-4">
              <Lock className="mr-2 h-4 w-4" />
              Área do Membro
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        <div
          className={cn(
            'md:hidden fixed inset-x-0 top-16 bg-background border-b shadow-lg transition-all duration-300 ease-in-out z-40',
            isMobileMenuOpen
              ? 'translate-y-0 opacity-100'
              : '-translate-y-full opacity-0 pointer-events-none',
          )}
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <button
              onClick={() => handleNavClick('home')}
              className="text-left text-sm font-medium py-2 border-b border-border/50"
            >
              Início
            </button>
            <button
              onClick={() => handleNavClick('quem-somos')}
              className="text-left text-sm font-medium py-2 border-b border-border/50"
            >
              Quem Somos
            </button>
            <button
              onClick={() => handleNavClick('pilares')}
              className="text-left text-sm font-medium py-2 border-b border-border/50"
            >
              Pilares
            </button>
            {sectionOrder.includes('venerables') && (
              <button
                onClick={() => handleNavClick('veneraveis')}
                className="text-left text-sm font-medium py-2 border-b border-border/50"
              >
                Galeria dos Veneráveis
              </button>
            )}
            {sectionOrder.includes('news') && (
              <button
                onClick={() => handleNavClick('noticias')}
                className="text-left text-sm font-medium py-2 border-b border-border/50"
              >
                Notícias
              </button>
            )}
            <button
              onClick={() => handleNavClick('contact')}
              className="text-left text-sm font-medium py-2 border-b border-border/50"
            >
              Contato
            </button>
            <Button onClick={handleMemberAccess} className="w-full mt-2">
              <Lock className="mr-2 h-4 w-4" />
              Acessar Sistema
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative w-full py-20 md:py-32 lg:py-48 flex items-center justify-center overflow-hidden scroll-mt-20"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/1920/1080?q=architectural%20columns%20hall&brightness=0"
            alt="Masonic Temple Hall"
            className="w-full h-full object-cover opacity-20 filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
        </div>

        <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center space-y-8 animate-fade-in-up">
          {/* Enhanced Logo Container - Optimized for Elegance and Proportion */}
          <div className="relative mb-6 group animate-float">
            {/* Soft Ambient Glow */}
            <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-primary/30 via-primary/10 to-secondary/30 blur-2xl opacity-40 group-hover:opacity-70 transition duration-1000"></div>

            {/* Main Container */}
            <div className="relative bg-background/95 backdrop-blur-xl rounded-full shadow-2xl border-4 border-double border-primary/20 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex items-center justify-center overflow-hidden p-0 transition-all duration-500 hover:scale-105 hover:border-primary/40 hover:shadow-primary/10">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Brasão da ARLS Templários da Paz"
                  className="w-full h-full object-contain drop-shadow-md transform transition-transform duration-700 group-hover:scale-110"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                  }}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <ShieldCheck className="h-16 w-16 md:h-24 md:w-24 text-primary/80" />
              )}
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-normal max-w-4xl relative z-20 leading-relaxed">
            Augusta e Respeitável Loja Simbólica
            <span className="text-primary block mt-4 drop-shadow-md text-shadow-sm">
              Templários da Paz
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[700px] md:text-2xl mt-4 leading-relaxed">
            Trabalhando pelo aperfeiçoamento moral, intelectual e social da
            humanidade em {contact.city || 'Botucatu-SP'}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              size="lg"
              onClick={() => handleNavClick('quem-somos')}
              className="text-lg px-8 py-6 h-auto"
            >
              Conheça Nossa História
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleMemberAccess}
              className="group text-lg px-8 py-6 h-auto"
            >
              Área Restrita
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

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
