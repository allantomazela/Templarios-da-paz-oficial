import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function Index() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMemberAccess = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>Templários da Paz</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection('home')}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Quem Somos
            </button>
            <button
              onClick={() => scrollToSection('values')}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Missão e Valores
            </button>
            <button
              onClick={() => scrollToSection('contact')}
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
              onClick={() => scrollToSection('home')}
              className="text-left text-sm font-medium py-2 border-b border-border/50"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-left text-sm font-medium py-2 border-b border-border/50"
            >
              Quem Somos
            </button>
            <button
              onClick={() => scrollToSection('values')}
              className="text-left text-sm font-medium py-2 border-b border-border/50"
            >
              Missão e Valores
            </button>
            <button
              onClick={() => scrollToSection('contact')}
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
        className="relative w-full py-20 md:py-32 lg:py-48 flex items-center justify-center overflow-hidden"
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
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-4xl">
            Augusta e Respeitável Loja Simbólica
            <span className="text-primary block mt-2">Templários da Paz</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[700px] md:text-2xl">
            Trabalhando pelo aperfeiçoamento moral, intelectual e social da
            humanidade em Botucatu-SP.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button size="lg" onClick={() => scrollToSection('about')}>
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

      {/* Who We Are Section */}
      <section id="about" className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <History className="mr-2 h-4 w-4" /> Nossa História
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Tradição e Modernidade
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Fundada com o propósito de reunir homens livres e de bons
                costumes, a ARLS Templários da Paz tem sido um pilar de
                fraternidade em Botucatu. Nossa loja preserva as antigas
                tradições maçônicas enquanto busca aplicar seus ensinamentos no
                mundo contemporâneo.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Através do estudo, da reflexão e da prática da beneficência,
                buscamos construir uma sociedade mais justa e igualitária,
                começando pela reforma íntima de cada um de nossos membros.
              </p>
            </div>
            <div className="relative aspect-video md:aspect-square overflow-hidden rounded-xl shadow-xl">
              <img
                src="https://img.usecurling.com/p/800/800?q=old%20books%20library"
                alt="História da Loja"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Values Section */}
      <section id="values" className="py-16 md:py-24">
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
              <p className="text-muted-foreground">
                Defendemos a liberdade de consciência, de pensamento e de
                expressão, essenciais para a dignidade humana.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Igualdade</h3>
              <p className="text-muted-foreground">
                Reconhecemos que todos os homens nascem iguais em direitos e
                deveres, sem distinção de raça, credo ou condição social.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fraternidade</h3>
              <p className="text-muted-foreground">
                Cultivamos o amor fraternal que une todos os maçons como irmãos,
                estendendo essa benevolência a toda a humanidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-16 md:py-24 bg-primary text-primary-foreground"
      >
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-6">
                Entre em Contato
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-[500px]">
                Interessado em saber mais sobre nossa ordem ou nossa loja?
                Estamos à disposição para esclarecer suas dúvidas.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 mt-1 opacity-80" />
                  <div>
                    <h4 className="font-semibold text-lg">Endereço</h4>
                    <p className="opacity-80">Rua das Acácias, 123</p>
                    <p className="opacity-80">Jardim Tropical</p>
                    <p className="opacity-80">Botucatu - SP, 18600-000</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 mt-1 opacity-80" />
                  <div>
                    <h4 className="font-semibold text-lg">Email</h4>
                    <p className="opacity-80">contato@templariosdapaz.com.br</p>
                    <p className="opacity-80">
                      secretaria@templariosdapaz.com.br
                    </p>
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

      {/* Footer */}
      <footer className="py-8 bg-muted text-muted-foreground border-t">
        <div className="container px-4 md:px-6 text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-lg text-foreground mb-4">
            <ShieldCheck className="h-5 w-5" />
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
