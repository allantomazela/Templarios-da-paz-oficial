import { useEffect } from 'react'
import { ExternalLink, Loader2, Link2 } from 'lucide-react'
import useEssentialLinksStore from '@/stores/useEssentialLinksStore'
import { resolveEssentialLinkIcon } from '@/lib/essential-link-icons'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function EssentialLinks() {
  const { links, loading, fetchLinks } = useEssentialLinksStore()

  useEffect(() => {
    void fetchLinks({ includeInactive: false })
  }, [fetchLinks])

  const linkCount = links.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Links Essenciais</h2>
          <p className="text-muted-foreground">
            Recursos e sites úteis do GOB-SP e da Federação.
          </p>
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">
          {linkCount} {linkCount === 1 ? 'link' : 'links'}
        </p>
      </div>

      {loading && links.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Link2 className="mb-3 h-10 w-10 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhum link disponível no momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {links.map((link) => {
            const Icon = resolveEssentialLinkIcon(link.icon_name)

            return (
              <Card
                key={link.id}
                className="flex flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <CardTitle className="text-base leading-snug">
                      {link.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-0" />
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full sm:w-auto" asChild>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Acessar
                      <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
