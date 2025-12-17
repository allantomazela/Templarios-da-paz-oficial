import { useState } from 'react'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Printer } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'
import {
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CashFlowReport() {
  const { transactions } = useFinancialStore()
  const { toast } = useToast()
  const [period, setPeriod] = useState('current_month')

  const getDateRange = () => {
    const now = new Date()
    switch (period) {
      case 'current_month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'last_month': {
        const lastMonth = subMonths(now, 1)
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
      }
      case 'current_year':
        return { start: startOfYear(now), end: endOfYear(now) }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }

  const { start, end } = getDateRange()

  const filteredTransactions = transactions
    .filter((t) => isWithinInterval(parseISO(t.date), { start, end }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'Receita')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'Despesa')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const netCashFlow = totalIncome - totalExpense

  // Group by Category
  const incomeByCategory = filteredTransactions
    .filter((t) => t.type === 'Receita')
    .reduce(
      (acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount
        return acc
      },
      {} as Record<string, number>,
    )

  const expenseByCategory = filteredTransactions
    .filter((t) => t.type === 'Despesa')
    .reduce(
      (acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount
        return acc
      },
      {} as Record<string, number>,
    )

  const handleExport = (format: 'csv' | 'pdf') => {
    toast({
      title: 'Download Iniciado',
      description: `Relatório de Fluxo de Caixa sendo gerado em ${format.toUpperCase()}...`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-medium">Fluxo de Caixa Detalhado</h3>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="current_year">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleExport('pdf')}
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-green-800">
              Total Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              R$ {totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-red-800">
              Total Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              R$ {totalExpense.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            netCashFlow >= 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-orange-50 border-orange-200'
          }
        >
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-foreground">
              Resultado Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}
            >
              R$ {netCashFlow.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border bg-card">
          <div className="p-4 font-medium border-b bg-muted/50">
            Receitas por Categoria
          </div>
          <Table>
            <TableBody>
              {Object.entries(incomeByCategory).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    Sem dados
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(incomeByCategory).map(([cat, val]) => (
                  <TableRow key={cat}>
                    <TableCell>{cat}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      R$ {val.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="rounded-md border bg-card">
          <div className="p-4 font-medium border-b bg-muted/50">
            Despesas por Categoria
          </div>
          <Table>
            <TableBody>
              {Object.entries(expenseByCategory).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    Sem dados
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(expenseByCategory).map(([cat, val]) => (
                  <TableRow key={cat}>
                    <TableCell>{cat}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      R$ {val.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
