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
    <section
      id="pilares"
      className="scroll-mt-20 border-t border-border/25 py-16 md:py-24"
    >
      <div className="container px-4 md:px-6">
        <div className="mb-14 text-center md:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-bold leading-snug tracking-normal md:text-4xl">
            Nossos Pilares
          </h2>
          <p className="mx-auto max-w-[700px] text-pretty text-lg leading-relaxed text-muted-foreground">
            Os princípios que guiam nossas ações e fortalecem nossa união na ARLS
            Templários da Paz.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card/80 p-7 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary ring-4 ring-primary/5">
              <Scale className="h-7 w-7" />
            </div>
            <h3 className="mb-3 text-xl font-bold">Liberdade</h3>
            <p className="leading-relaxed text-muted-foreground">
              {liberty ||
                'A liberdade de pensamento e expressão é fundamental para o progresso humano e para a construção de uma sociedade mais justa.'}
            </p>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card/80 p-7 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary ring-4 ring-primary/5">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="mb-3 text-xl font-bold">Igualdade</h3>
            <p className="leading-relaxed text-muted-foreground">
              {equality ||
                'Todos os seres humanos nascem livres e iguais em dignidade e direitos, devendo agir uns para com os outros com espírito de fraternidade.'}
            </p>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card/80 p-7 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary ring-4 ring-primary/5">
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="mb-3 text-xl font-bold">Fraternidade</h3>
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

