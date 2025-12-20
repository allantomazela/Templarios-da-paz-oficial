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
import { CalendarDays, Newspaper } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AddToCalendar } from '@/components/news/AddToCalendar'

export function NewsSection() {
  const { news, fetchPublicNews } = useNewsStore()

  useEffect(() => {
    fetchPublicNews()
  }, [fetchPublicNews])

  if (news.length === 0) return null

  return (
    <section id="news" className="py-16 md:py-24 bg-muted/10">
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
                  <Badge variant="secondary" className="mb-2">
                    {item.eventDate ? 'Evento' : 'Notícia'}
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
      </div>
    </section>
  )
}
