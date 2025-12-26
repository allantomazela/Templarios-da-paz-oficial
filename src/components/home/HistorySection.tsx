import { History } from 'lucide-react'

interface HistorySectionProps {
  title: string
  text: string
  imageUrl?: string
}

export function HistorySection({ title, text, imageUrl }: HistorySectionProps) {
  return (
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
              {title}
            </h2>
            <div className="text-lg text-muted-foreground leading-relaxed">
              {text}
            </div>
          </div>
          <div className="relative aspect-video md:aspect-square overflow-hidden rounded-xl shadow-xl">
            <img
              src={
                imageUrl ||
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
}

