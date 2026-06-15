import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyBRL } from '@/lib/member-payments'
import type { OverdueBrotherAlert } from '@/lib/membership-schedule'

interface MembershipOverduePanelProps {
  alerts: OverdueBrotherAlert[]
  onSelectBrother?: (brotherId: string) => void
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

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive text-base">
          <AlertTriangle className="h-5 w-5" />
          Irmãos com mensalidades em atraso ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.brotherId}
            className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1 min-w-0">
              <p className="font-medium truncate">{alert.brotherName}</p>
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
        ))}
      </CardContent>
    </Card>
  )
}
