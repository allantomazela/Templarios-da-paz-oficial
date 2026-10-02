import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { MEMBERSHIP_LABELS } from '@/lib/membership-labels'
import type { MembershipScheduleEntry } from '@/lib/membership-schedule'

interface MembershipScheduleSummaryAlertsProps {
  openEntriesCount: number
  overdueEntries: MembershipScheduleEntry[]
  upcomingEntries: MembershipScheduleEntry[]
  totalOverdue: number
  totalOpen: number
  treasuryPaidTotal: number
}

/** Orientações de uso e resumo (em atraso x à vencer) do cronograma do irmão. */
export function MembershipScheduleSummaryAlerts({
  openEntriesCount,
  overdueEntries,
  upcomingEntries,
  totalOverdue,
  totalOpen,
  treasuryPaidTotal,
}: MembershipScheduleSummaryAlertsProps) {
  return (
    <>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-1 text-sm">
          <p>
            <strong>Um mês</strong> — clique em <strong>Lançar</strong> na linha
            (ex.: Renan quitando só jul/2026).
          </p>
          <p>
            <strong>Vários meses no mesmo PIX</strong> — marque os meses e use{' '}
            <strong>Registrar pagamento na tesouraria</strong> (quitação em lote).
          </p>
        </AlertDescription>
      </Alert>

      {openEntriesCount >= 2 ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTitle className="text-sm font-medium">
            {openEntriesCount} meses com valor a receber neste irmão
          </AlertTitle>
          <AlertDescription className="text-sm">
            Se o pagamento recebido cobre mais de um mês, selecione todos os meses
            quitados antes de registrar. Use &quot;Selecionar todos a receber&quot; e
            depois &quot;Registrar pagamento na tesouraria&quot;.
          </AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-1">
          {overdueEntries.length > 0 ? (
            <p>
              <strong className="text-destructive">
                {overdueEntries.length} mês(es){' '}
                {MEMBERSHIP_LABELS.overdue.toLowerCase()}
              </strong>{' '}
              — {overdueEntries.map((e) => e.periodLabel).join(', ')} (
              {formatCurrencyBRL(totalOverdue)}). Meses já
              fechados sem pagamento — priorize a cobrança.
            </p>
          ) : null}
          {upcomingEntries.length > 0 ? (
            <p>
              <strong className="text-sky-700">
                {upcomingEntries.length} mês(es){' '}
                {MEMBERSHIP_LABELS.upcoming.toLowerCase()}
              </strong>{' '}
              — {upcomingEntries.map((e) => e.periodLabel).join(', ')} (
              {formatCurrencyBRL(totalOpen)}). Podem ser pagos
              em qualquer dia do mês, sem constar atraso.
            </p>
          ) : null}
          {overdueEntries.length === 0 && upcomingEntries.length === 0 ? (
            <p>Cronograma quitado nos meses exibidos.</p>
          ) : null}
          <p>
            Receita registrada:{' '}
            <strong>{formatCurrencyBRL(treasuryPaidTotal)}</strong>.
          </p>
        </AlertDescription>
      </Alert>
    </>
  )
}
