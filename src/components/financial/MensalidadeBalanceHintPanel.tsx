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
          Possível mensalidade duplicada no saldo
        </CardTitle>
        <CardDescription className="text-amber-800/90 dark:text-amber-300/90">
          O sistema está acima do extrato e há receitas de Mensalidade sem vínculo no
          cronograma. Exclua o lançamento manual extra — marcar alerta como verificado{' '}
          <strong>não corrige</strong> o saldo.
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
                      Sem vínculo no cronograma de Mensalidades — candidata a exclusão nos
                      Alertas de auditoria (aba Erros reais).
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
