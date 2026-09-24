import { useEffect, useState } from 'react'
import useNewsStore, { type NewsEvent } from '@/stores/useNewsStore'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CalendarDays,
  Newspaper,
  PartyPopper,
  Loader2,
  Info,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCalendarDate } from '@/lib/format-utils'
import { AddToCalendar } from '@/components/news/AddToCalendar'
import { cn } from '@/lib/utils'

const PREVIEW_CHAR_LIMIT = 220

export function NewsSection() {
  const { news, fetchPublicNews, loading } = useNewsStore()
  const [selectedItem, setSelectedItem] = useState<NewsEvent | null>(null)

  useEffect(() => {
    fetchPublicNews()
  }, [fetchPublicNews])

  return (
    <section
      id="noticias"
      className="scroll-mt-20 border-t border-border/25 bg-muted/15 py-16 md:py-24"
    >
      <div className="container px-4 md:px-6">
        <div className="mb-12 text-center md:mb-14">
          <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/15">
            <Newspaper className="mr-2 h-4 w-4" /> Notícias e Eventos
          </div>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-normal md:text-4xl">
            Acontece na Loja
          </h2>
          <p className="mx-auto max-w-[700px] text-pretty text-lg leading-relaxed text-muted-foreground">
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
            <p className="text-muted-foreground max-w-md px-4 leading-relaxed">
              Estamos preparando conteúdo especial para você. Volte em breve
              para conferir as notícias e eventos da nossa loja.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => {
              const content = item.content?.trim() || ''
              const isLong = content.length > PREVIEW_CHAR_LIMIT

              return (
                <Card
                  key={item.id}
                  className="flex flex-col h-full hover:shadow-lg transition-shadow overflow-hidden group"
                >
                  {item.imageUrl && (
                    <button
                      type="button"
                      className="aspect-video w-full overflow-hidden text-left"
                      onClick={() => setSelectedItem(item)}
                      aria-label={`Abrir ${item.title}`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </button>
                  )}
                  <CardHeader className="text-left">
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
                        {item.category === 'social'
                          ? 'Evento Social'
                          : 'Notícia'}
                      </Badge>
                      {item.eventDate && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarDays className="mr-1 h-3 w-3" />
                          {formatCalendarDate(item.eventDate, 'dd MMM yyyy', {
                            locale: ptBR,
                          })}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl text-left leading-snug group-hover:text-primary transition-colors">
                      <button
                        type="button"
                        className="text-left hover:underline decoration-primary/40 underline-offset-2"
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.title}
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 text-left space-y-3">
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {isLong
                        ? `${content.slice(0, PREVIEW_CHAR_LIMIT).trimEnd()}…`
                        : content}
                    </p>
                    {isLong && (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-primary"
                        onClick={() => setSelectedItem(item)}
                      >
                        Ler mensagem completa
                      </Button>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between items-center bg-muted/5 text-left">
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
                          location: 'Loja Templários da Paz',
                        }}
                        variant="ghost"
                        size="sm"
                      />
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader className="text-left space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      selectedItem.category === 'social'
                        ? 'secondary'
                        : 'default'
                    }
                    className={cn(
                      selectedItem.category === 'social'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700',
                    )}
                  >
                    {selectedItem.category === 'social'
                      ? 'Evento Social'
                      : 'Notícia'}
                  </Badge>
                  {selectedItem.eventDate && (
                    <span className="inline-flex items-center text-xs text-muted-foreground">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      {formatCalendarDate(
                        selectedItem.eventDate,
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR },
                      )}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-2xl leading-snug text-left">
                  {selectedItem.title}
                </DialogTitle>
                <DialogDescription className="text-left">
                  Publicado em{' '}
                  {format(
                    new Date(selectedItem.createdAt),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR },
                  )}
                </DialogDescription>
              </DialogHeader>

              {selectedItem.imageUrl && (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-full max-h-[360px] object-cover"
                  />
                </div>
              )}

              <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {selectedItem.content}
              </div>

              {selectedItem.eventDate && (
                <div className="flex justify-end border-t pt-4">
                  <AddToCalendar
                    event={{
                      title: selectedItem.title,
                      description: selectedItem.content,
                      date: selectedItem.eventDate,
                      location: 'Loja Templários da Paz',
                    }}
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
