import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  History,
  Scale,
  Heart,
  MapPin,
  Mail,
  ChevronRight,
  Menu,
  X,
  Lock,
  Award,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useState, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { NewsSection } from '@/components/home/NewsSection'

export default function Index() {
  const { isAuthenticated } = useAuthStore()
  const {
    logoUrl,
    history,
    values,
    contact,
    venerables,
    sectionOrder,
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
  }, [location.hash, history, values, venerables])

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

  // --- Sections Components ---

  const HistorySection = () => (
    <section
      id="quem-somos"
      className="py-16 md:py-24 bg-muted/30 scroll-mt-20"
    >
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <History className="mr-2 h-4 w-4" /> Nossa História
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              {history.title}
            </h2>
            <div className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
              {history.text}
            </div>
          </div>
          <div className="relative aspect-video md:aspect-square overflow-hidden rounded-xl shadow-xl">
            <img
              src={
                history.imageUrl ||
                'https://img.usecurling.com/p/800/800?q=old%20books%20library'
              }
              alt="História da Loja"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  )

  const ValuesSection = () => (
    <section id="pilares" className="py-16 md:py-24 scroll-mt-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-4">
            Nossos Pilares
          </h2>
          <p className="text-muted-foreground text-lg max-w-[700px] mx-auto">
            Os princípios que guiam nossas ações e fortalecem nossa união.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
              <Scale className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Liberdade</h3>
            <p className="text-muted-foreground">{values.liberty}</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Igualdade</h3>
            <p className="text-muted-foreground">{values.equality}</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fraternidade</h3>
            <p className="text-muted-foreground">{values.fraternity}</p>
          </div>
        </div>
      </div>
    </section>
  )

  const VenerablesSection = () => (
    <section
      id="veneraveis"
      className="py-16 md:py-24 bg-muted/20 scroll-mt-20"
    >
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
            <Award className="mr-2 h-4 w-4" /> Nossa Liderança
          </div>
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-4">
            Galeria dos Veneráveis
          </h2>
          <p className="text-muted-foreground text-lg max-w-[700px] mx-auto">
            Homenagem aos irmãos que lideraram nossa oficina com sabedoria e
            dedicação ao longo dos anos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {venerables.map((master) => (
            <div
              key={master.id}
              className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                <img
                  src={
                    master.imageUrl ||
                    `https://img.usecurling.com/ppl/medium?gender=male&seed=${master.id}`
                  }
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={`Venerável Mestre ${master.name}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-5 text-center relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-background flex items-center justify-center border-4 border-background shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-1">{master.name}</h3>
                <p className="text-sm font-medium text-primary bg-primary/5 inline-block px-3 py-1 rounded-full">
                  {master.period}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  const ContactSection = () => (
    <section
      id="contact"
      className="py-16 md:py-24 bg-primary text-primary-foreground scroll-mt-20"
    >
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-6">
              Entre em Contato
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-[500px]">
              Interessado em saber mais sobre nossa ordem ou nossa loja? Estamos
              à disposição para esclarecer suas dúvidas.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 mt-1 opacity-80" />
                <div>
                  <h4 className="font-semibold text-lg">Endereço</h4>
                  <p className="opacity-80">{contact.address}</p>
                  <p className="opacity-80">{contact.city}</p>
                  <p className="opacity-80">{contact.zip}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 mt-1 opacity-80" />
                <div>
                  <h4 className="font-semibold text-lg">Email</h4>
                  <p className="opacity-80">{contact.email}</p>
                  {contact.secondaryEmail && (
                    <p className="opacity-80">{contact.secondaryEmail}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background text-foreground rounded-xl p-6 shadow-2xl">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome Completo
                </label>
                <input
                  id="name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Como podemos ajudar?"
                />
              </div>
              <Button type="button" className="w-full">
                Enviar Mensagem
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )

  // Map section keys to components
  const sectionComponents: Record<string, ReactNode> = {
    history: <HistorySection key="history" />,
    values: <ValuesSection key="values" />,
    venerables: <VenerablesSection key="venerables" />,
    news: <NewsSection key="news" />,
    contact: <ContactSection key="contact" />,
    masters: <VenerablesSection key="masters" />,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl h-full py-2">
            <div className="h-full aspect-square relative flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-auto max-h-12 object-contain"
                />
              ) : (
                <ShieldCheck className="h-8 w-8 text-primary" />
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
              Missão e Valores
            </button>
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

        <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center space-y-6 animate-fade-in-up">
          <div className="p-4 bg-background/80 backdrop-blur-sm rounded-full mb-4 shadow-lg border border-primary/20 w-32 h-32 flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <ShieldCheck className="h-16 w-16 text-primary" />
            )}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-4xl">
            Augusta e Respeitável Loja Simbólica
            <span className="text-primary block mt-2">Templários da Paz</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[700px] md:text-2xl">
            Trabalhando pelo aperfeiçoamento moral, intelectual e social da
            humanidade em {contact.city || 'Botucatu-SP'}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button size="lg" onClick={() => handleNavClick('quem-somos')}>
              Conheça Nossa História
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleMemberAccess}
              className="group"
            >
              Área Restrita
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {sectionOrder.map((sectionKey) => sectionComponents[sectionKey])}

      {/* Footer */}
      <footer className="py-8 bg-muted text-muted-foreground border-t">
        <div className="container px-4 md:px-6 text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-lg text-foreground mb-4">
            <div className="h-8 w-8 relative flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <span>Templários da Paz</span>
          </div>
          <p className="text-sm mb-4">
            © {new Date().getFullYear()} ARLS Templários da Paz. Todos os
            direitos reservados.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="#" className="hover:text-primary transition-colors">
              Privacidade
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Termos de Uso
            </a>
            <a href="/login" className="hover:text-primary transition-colors">
              Área Restrita
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
