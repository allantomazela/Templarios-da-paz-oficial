import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Brother } from '@/lib/data'
import { isBrotherOnActiveSecretariatRoster } from '@/lib/brother-membership-situation'

const BROTHER_DEGREES: Brother['degree'][] = ['Aprendiz', 'Companheiro', 'Mestre']

interface BrothersDegreeSummaryProps {
  brothers: Brother[]
  loading: boolean
}

/** Contagem do quadro ativo (regulares + afastados). Desligados e In Memoriam ficam de fora. */
export function BrothersDegreeSummary({ brothers, loading }: BrothersDegreeSummaryProps) {
  const summary = useMemo(() => {
    const counts: Record<Brother['degree'], number> = {
      Aprendiz: 0,
      Companheiro: 0,
      Mestre: 0,
    }

    let total = 0
    for (const brother of brothers) {
      if (!isBrotherOnActiveSecretariatRoster(brother)) continue
      counts[brother.degree] += 1
      total += 1
    }

    return { counts, total }
  }, [brothers])

  if (loading) return null

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 rounded-md border bg-muted/40 px-3 py-2 text-sm"
      aria-label="Resumo do quadro ativo por grau"
    >
      <span className="text-muted-foreground">Quadro ativo</span>
      {BROTHER_DEGREES.map((degree) => (
        <span key={degree} className="inline-flex items-center gap-1.5">
          <span className="text-muted-foreground">{degree}</span>
          <Badge variant="secondary" className="min-w-[2rem] justify-center font-semibold tabular-nums">
            {summary.counts[degree]}
          </Badge>
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 border-l border-border pl-3 sm:ml-1">
        <span className="font-medium">Total</span>
        <Badge className="min-w-[2rem] justify-center font-semibold tabular-nums">
          {summary.total}
        </Badge>
      </span>
    </div>
  )
}
