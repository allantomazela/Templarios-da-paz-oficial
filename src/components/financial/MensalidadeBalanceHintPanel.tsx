import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import type { MensalidadeBalanceHint } from '@/lib/account-reconciliation-mensalidade-hints'

interface MensalidadeBalanceHintPanelProps {
  hints: MensalidadeBalanceHint[]
}

export function MensalidadeBalanceHintPanel({ hints }: MensalidadeBalanceHintPanelProps) {
  if (hints.length === 0) return null

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <AlertCircle className="h-4 w-4" />
          Mensalidade que explica a diferença
        </CardTitle>
        <CardDescription className="text-amber-800/90 dark:text-amber-300/90">
          O valor abaixo bate com a diferença entre sistema e extrato. Vincule no
          cronograma de Mensalidades ou exclua se for lançamento duplicado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hints.map((hint) => (
          <Alert key={hint.accountId} variant="default" className="border-amber-300 bg-white">
            <AlertTitle className="text-sm">
              {hint.accountName}: sistema +{formatCurrencyBRL(hint.systemOverReal)} acima do
              extrato
              {hint.matchesDifference ? ' — bate com mensalidade(s) abaixo' : ''}
            </AlertTitle>
            <AlertDescription asChild>
              <ul className="mt-2 space-y-2 text-sm">
                {hint.unlinkedTransactions.map(({ transaction }) => (
                  <li key={transaction.id} className="rounded border px-2 py-1.5">
                    <span className="font-medium">{formatDateBR(transaction.date)}</span>
                    {' — '}
                    {transaction.description}
                    {' — '}
                    {formatCurrencyBRL(transaction.amount)}
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Valor coincide com a divergência — use Mensalidades para vincular
                      ou exclua a receita duplicada em Receitas.
                    </span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
