import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { formatCurrencyBRL } from '@/lib/format-utils'

interface AgapeBeveragesTotalCardProps {
  totalBeveragesInput: string
  onTotalBeveragesInputChange: (value: string) => void
  canEdit: boolean
  saving: boolean
  onSave: () => void
  totalBeverages: number
  totalPaid: number
  paymentProgress: number
  remainingBalance: number
}

export function AgapeBeveragesTotalCard({
  totalBeveragesInput,
  onTotalBeveragesInputChange,
  canEdit,
  saving,
  onSave,
  totalBeverages,
  totalPaid,
  paymentProgress,
  remainingBalance,
}: AgapeBeveragesTotalCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Valor total das bebidas</CardTitle>
        <CardDescription>
          Informe no final do mês quanto foi gasto no total. O saldo vai
          diminuindo conforme cada irmão paga a sua parte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="total-beverages">Total gasto em bebidas (R$)</Label>
            <Input
              id="total-beverages"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex.: 850.00"
              value={totalBeveragesInput}
              onChange={(e) => onTotalBeveragesInputChange(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          {canEdit && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar total
            </Button>
          )}
        </div>

        {totalBeverages > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recebido dos irmãos</span>
              <span className="font-medium">
                {formatCurrencyBRL(totalPaid)} de {formatCurrencyBRL(totalBeverages)}
              </span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
            <p className="text-sm">
              <span className="text-muted-foreground">Saldo restante: </span>
              <span
                className={
                  remainingBalance <= 0.009
                    ? 'font-semibold text-green-600'
                    : 'font-semibold text-amber-600'
                }
              >
                {formatCurrencyBRL(remainingBalance)}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
