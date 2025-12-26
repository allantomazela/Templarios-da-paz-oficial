import { Scale, ShieldCheck, Heart } from 'lucide-react'

interface ValuesSectionProps {
  liberty?: string
  equality?: string
  fraternity?: string
}

export function ValuesSection({
  liberty,
  equality,
  fraternity,
}: ValuesSectionProps) {
  return (
    <section id="pilares" className="py-16 md:py-24 scroll-mt-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-4">
            Nossos Pilares
          </h2>
          <p className="text-muted-foreground text-lg max-w-[700px] mx-auto leading-relaxed">
            Os princípios que guiam nossas ações e fortalecem nossa união.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
              <Scale className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Liberdade</h3>
            <p className="text-muted-foreground leading-relaxed">
              {liberty ||
                'A liberdade de pensamento e expressão é fundamental para o progresso humano e para a construção de uma sociedade mais justa.'}
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Igualdade</h3>
            <p className="text-muted-foreground leading-relaxed">
              {equality ||
                'Todos os seres humanos nascem livres e iguais em dignidade e direitos, devendo agir uns para com os outros com espírito de fraternidade.'}
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fraternidade</h3>
            <p className="text-muted-foreground leading-relaxed">
              {fraternity ||
                'A prática da tolerância, da solidariedade e do amor ao próximo une a humanidade em uma só família universal.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

