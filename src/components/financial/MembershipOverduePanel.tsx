import { AlertTriangle, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyBRL } from '@/lib/member-payments'
import type { OverdueBrotherAlert } from '@/lib/membership-schedule'
import { splitOverdueAlertsByEscalation } from '@/lib/membership-payment-guidance'

interface MembershipOverduePanelProps {
  alerts: OverdueBrotherAlert[]
  onSelectBrother?: (brotherId: string) => void
}

function OverdueBrotherCard({
  alert,
  onSelectBrother,
  priority,
}: {
  alert: OverdueBrotherAlert
  onSelectBrother?: (brotherId: string) => void
  priority?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium truncate">{alert.brotherName}</p>
          {priority ? (
            <Badge variant="destructive" className="text-xs">
              Prioridade tesouraria
            </Badge>
          ) : null}
          {alert.overdueCount >= 2 ? (
            <Badge variant="outline" className="text-xs">
              Sugerir quitação em lote
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {alert.overdueCount} mês(es) em atraso —{' '}
          <span className="font-semibold text-destructive">
            {formatCurrencyBRL(alert.overdueAmount)}
          </span>
        </p>
        <div className="flex flex-wrap gap-1">
          {alert.overdueLabels.map((label) => (
            <Badge key={label} variant="outline" className="text-xs">
              {label}
            </Badge>
          ))}
        </div>
      </div>
      {onSelectBrother ? (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onSelectBrother(alert.brotherId)}
        >
          Ver cronograma
        </Button>
      ) : null}
    </div>
  )
}

export function MembershipOverduePanel({
  alerts,
  onSelectBrother,
}: MembershipOverduePanelProps) {
  if (alerts.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <AlertTitle className="text-green-800 dark:text-green-300">
          Mensalidades em dia
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          Nenhum irmão com mensalidade em atraso no cronograma atual.
        </AlertDescription>
      </Alert>
    )
  }

  const { escalation, regular } = splitOverdueAlertsByEscalation(alerts)

  return (
    <div className="space-y-4">
      {escalation.length > 0 ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="h-5 w-5" />
              Prioridade tesouraria — 3+ meses em atraso ({escalation.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Após três mensalidades em débito, a situação deve ser tratada com
              prioridade. Use o cronograma para quitar em lote quando houver pagamento
              único.
            </p>
            {escalation.map((alert) => (
              <OverdueBrotherCard
                key={alert.brotherId}
                alert={alert}
                onSelectBrother={onSelectBrother}
                priority
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      {regular.length > 0 ? (
        <Card className="border-amber-200/80 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-base">
              <Info className="h-5 w-5" />
              Mensalidades em atraso ({regular.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {regular.map((alert) => (
              <OverdueBrotherCard
                key={alert.brotherId}
                alert={alert}
                onSelectBrother={onSelectBrother}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
