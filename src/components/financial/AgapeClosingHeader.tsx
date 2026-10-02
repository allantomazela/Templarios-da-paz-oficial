import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, RefreshCw, Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AgapeClosingHeaderProps {
  selectedMonth: number
  selectedYear: number
  onPeriodChange: (year: number, month: number) => void
  loading: boolean
  onRefresh: () => void
}

export function AgapeClosingHeader({
  selectedMonth,
  selectedYear,
  onPeriodChange,
  loading,
  onRefresh,
}: AgapeClosingHeaderProps) {
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      }
    })
  }, [])

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wine className="h-5 w-5" />
          Fechamento do Ágape
        </h3>
        <p className="text-sm text-muted-foreground">
          Informe o total gasto em bebidas, importe o consumo de cada irmão e
          acompanhe o saldo restante conforme os pagamentos entram. Erros de
          lançamento podem ser corrigidos na seção <strong>Correções e ajustes</strong>{' '}
          ou linha a linha na tabela.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={`${selectedYear}-${selectedMonth}`}
          onValueChange={(v) => {
            const [y, m] = v.split('-').map(Number)
            onPeriodChange(y, m)
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem
                key={`${opt.year}-${opt.month}`}
                value={`${opt.year}-${opt.month}`}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>
    </div>
  )
}
