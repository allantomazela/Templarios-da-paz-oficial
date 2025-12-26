import { Award } from 'lucide-react'
import { Venerable } from '@/stores/useSiteSettingsStore'

interface VenerablesSectionProps {
  venerables: Venerable[]
}

export function VenerablesSection({ venerables }: VenerablesSectionProps) {
  return (
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
          <p className="text-muted-foreground text-lg max-w-[700px] mx-auto leading-relaxed">
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
}

