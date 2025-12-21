import { useEffect } from 'react'
import useNewsStore from '@/stores/useNewsStore'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  Newspaper,
  PartyPopper,
  Loader2,
  Info,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AddToCalendar } from '@/components/news/AddToCalendar'
import { cn } from '@/lib/utils'

export function NewsSection() {
  const { news, fetchPublicNews, loading } = useNewsStore()

  useEffect(() => {
    fetchPublicNews()
  }, [fetchPublicNews])

  return (
    <section id="noticias" className="py-16 md:py-24 bg-muted/10 scroll-mt-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
            <Newspaper className="mr-2 h-4 w-4" /> Notícias e Eventos
          </div>
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-4">
            Acontece na Loja
          </h2>
          <p className="text-muted-foreground text-lg max-w-[700px] mx-auto">
            Fique por dentro das últimas atividades e eventos da nossa oficina.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/30">
            <div className="bg-background p-4 rounded-full shadow-sm mb-4">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Novidades em breve</h3>
            <p className="text-muted-foreground max-w-md px-4">
              Estamos preparando conteúdo especial para você. Volte em breve
              para conferir as notícias e eventos da nossa loja.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <Card
                key={item.id}
                className="flex flex-col h-full hover:shadow-lg transition-shadow overflow-hidden group"
              >
                {item.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge
                      variant={
                        item.category === 'social' ? 'secondary' : 'default'
                      }
                      className={cn(
                        'mb-2',
                        item.category === 'social'
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                      )}
                    >
                      {item.category === 'social' ? (
                        <PartyPopper className="w-3 h-3 mr-1" />
                      ) : (
                        <Newspaper className="w-3 h-3 mr-1" />
                      )}
                      {item.category === 'social' ? 'Evento Social' : 'Notícia'}
                    </Badge>
                    {item.eventDate && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarDays className="mr-1 h-3 w-3" />
                        {format(new Date(item.eventDate), 'dd MMM yyyy', {
                          locale: ptBR,
                        })}
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm line-clamp-4">
                    {item.content}
                  </p>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between items-center bg-muted/5">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), "dd 'de' MMM", {
                      locale: ptBR,
                    })}
                  </span>
                  {item.eventDate && (
                    <AddToCalendar
                      event={{
                        title: item.title,
                        description: item.content,
                        date: item.eventDate,
                        location: 'Loja Templários da Paz', // Default fallback location
                      }}
                      variant="ghost"
                      size="sm"
                    />
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
