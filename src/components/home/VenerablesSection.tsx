import { Award } from 'lucide-react'
import { Venerable } from '@/stores/useSiteSettingsStore'

interface VenerablesSectionProps {
  venerables: Venerable[]
}

export function VenerablesSection({ venerables }: VenerablesSectionProps) {
  return (
    <section
      id="veneraveis"
      className="scroll-mt-20 border-t border-border/25 bg-muted/20 py-16 md:py-24"
    >
      <div className="container px-4 md:px-6">
        <div className="mb-14 text-center md:mb-16">
          <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/15">
            <Award className="mr-2 h-4 w-4" /> Nossa Liderança
          </div>
          <h2 className="mb-4 text-balance text-3xl font-bold leading-snug tracking-normal md:text-4xl">
            Galeria dos Veneráveis
          </h2>
          <p className="mx-auto max-w-[700px] text-pretty text-lg leading-relaxed text-muted-foreground">
            Homenagem aos irmãos que lideraram nossa oficina com sabedoria e
            dedicação ao longo dos anos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {venerables.map((master) => (
            <div
              key={master.id}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl"
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
}

