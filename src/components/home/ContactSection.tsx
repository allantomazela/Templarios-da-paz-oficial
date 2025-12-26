import { MapPin, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContactSectionProps {
  address: string
  city: string
  zip: string
  email: string
  secondaryEmail?: string
}

export function ContactSection({
  address,
  city,
  zip,
  email,
  secondaryEmail,
}: ContactSectionProps) {
  return (
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
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-[500px] leading-relaxed">
              Interessado em saber mais sobre nossa ordem ou nossa loja? Estamos
              à disposição para esclarecer suas dúvidas.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 mt-1 opacity-80" />
                <div>
                  <h4 className="font-semibold text-lg">Endereço</h4>
                  <p className="opacity-80 leading-relaxed">{address}</p>
                  <p className="opacity-80 leading-relaxed">{city}</p>
                  <p className="opacity-80 leading-relaxed">{zip}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 mt-1 opacity-80" />
                <div>
                  <h4 className="font-semibold text-lg">Email</h4>
                  <p className="opacity-80 leading-relaxed">{email}</p>
                  {secondaryEmail && (
                    <p className="opacity-80 leading-relaxed">{secondaryEmail}</p>
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
}

