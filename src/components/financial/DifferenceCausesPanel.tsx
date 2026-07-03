import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Search, AlertCircle } from 'lucide-react'
import type { AccountReconciliationAudit } from '@/lib/account-reconciliation'
import type { AccountReconciliationWithReal } from '@/lib/account-reconciliation'
import {
  buildCashReconciliationSummary,
  filterAuditForDifferenceExplaining,
} from '@/lib/account-reconciliation-difference-causes'
import { ReconciliationAuditAlerts } from '@/components/financial/ReconciliationAuditAlerts'

interface DifferenceCausesPanelProps {
  audit: AccountReconciliationAudit
  enrichedDetails: AccountReconciliationWithReal[]
  accountNameById: Record<string, string>
  linkedMensalidadeIds: Set<string>
  onResolved: () => void
}

export function DifferenceCausesPanel({
  audit,
  enrichedDetails,
  accountNameById,
  linkedMensalidadeIds,
  onResolved,
}: DifferenceCausesPanelProps) {
  const summary = useMemo(
    () => buildCashReconciliationSummary(enrichedDetails),
    [enrichedDetails],
  )

  const filteredAudit = useMemo(
    () => filterAuditForDifferenceExplaining(audit, enrichedDetails),
    [audit, enrichedDetails],
  )

  const causeCount = useMemo(() => {
    return (
      filteredAudit.unlinkedMensalidade.length +
      filteredAudit.duplicateGroups.length +
      filteredAudit.sameMonthMensalidadeGroups.length
    )
  }, [filteredAudit])

  if (summary.accountsWithDifference === 0) {
    return null
  }

  if (causeCount === 0) {
    return (
      <Alert>
        <Search className="h-4 w-4" />
        <AlertTitle>Nenhum lançamento óbvio explica a diferença</AlertTitle>
        <AlertDescription>
          Revise receitas e despesas recentes da conta com divergência, ou ajuste
          o saldo inicial se o extrato estiver correto. Mensalidades sem vínculo
          que não batem com o valor da diferença ficam em Financeiro → Receitas
          (filtro &quot;Sem vínculo no cronograma&quot;).
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          O que pode explicar a diferença?
        </CardTitle>
        <CardDescription>
          Lançamentos que, se removidos ou corrigidos, aproximam o saldo do
          sistema ao extrato. Exclua duplicatas ou vincule mensalidades — isso
          corrige o saldo automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ReconciliationAuditAlerts
          audit={filteredAudit}
          accountNameById={accountNameById}
          linkedMensalidadeIds={linkedMensalidadeIds}
          onAlertAcknowledged={onResolved}
          variant="difference-causes"
        />
      </CardContent>
    </Card>
  )
}
