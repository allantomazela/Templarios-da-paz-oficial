import { useState, useRef, useEffect } from 'react'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Printer, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
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
import { useReactToPrint } from 'react-to-print'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { Transaction } from '@/lib/data'

interface TransactionFromDB {
  id: string
  date: string
  description: string
  category_id: string
  type: 'Receita' | 'Despesa'
  amount: number
  account_id: string | null
  financial_categories?: {
    id: string
    name: string
  }
}

export function CashFlowReport() {
<<<<<<< HEAD
  const { transactions, fetchTransactions } = useFinancialStore()

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])
=======
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
>>>>>>> c2521e56afe76ce1fb856c2a463dd416fbc37422
  const { toast } = useToast()
  const [period, setPeriod] = useState('current_month')
  const printRef = useRef<HTMLDivElement>(null)
  const supabaseAny = supabase as any

  // Load transactions from Supabase
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabaseAny
          .from('financial_transactions')
          .select(
            `
            *,
            financial_categories!financial_transactions_category_id_fkey (
              id,
              name
            )
          `,
          )
          .order('date', { ascending: false })

        if (error) throw error

        const mapped: Transaction[] = (data || []).map((t: TransactionFromDB) => ({
          id: t.id,
          date: t.date,
          description: t.description,
          category: t.financial_categories?.name || 'Sem categoria',
          type: t.type,
          amount: parseFloat(t.amount.toString()),
          accountId: t.account_id || undefined,
        }))

        setTransactions(mapped)
      } catch (error) {
        console.error('Error loading transactions:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar transações.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [supabaseAny, toast])

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Fluxo_Caixa_${period}`,
    onAfterPrint: () => {
      toast({
        title: 'Relatório Impresso',
        description: 'Relatório de fluxo de caixa enviado para impressão.',
      })
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando dados do fluxo de caixa...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
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
          <Button variant="outline" size="icon" onClick={() => handlePrint()}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Screen View */}
      <div className="grid gap-4 md:grid-cols-3 no-print">
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

      <div className="grid gap-6 md:grid-cols-2 no-print">
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

      {/* Printable Area */}
      <div
        className="hidden print:block p-8 bg-white text-black"
        ref={printRef}
      >
        <ReportHeader
          title="Relatório de Fluxo de Caixa"
          description={`Demonstrativo financeiro para o período selecionado (${period.replace('_', ' ')})`}
        />

        <div className="grid grid-cols-3 gap-8 mb-8 border-b pb-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase text-gray-500 mb-1">
              Total Entradas
            </p>
            <p className="text-2xl font-bold text-green-700">
              R$ {totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="text-center border-x">
            <p className="text-sm font-bold uppercase text-gray-500 mb-1">
              Total Saídas
            </p>
            <p className="text-2xl font-bold text-red-700">
              R$ {totalExpense.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold uppercase text-gray-500 mb-1">
              Resultado
            </p>
            <p
              className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-700' : 'text-red-700'}`}
            >
              R$ {netCashFlow.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold border-b pb-2 mb-2 text-lg">Receitas</h4>
            <Table>
              <TableBody>
                {Object.entries(incomeByCategory).map(([cat, val]) => (
                  <TableRow key={cat} className="border-b border-gray-200">
                    <TableCell className="py-2 pl-0 font-medium text-black">
                      {cat}
                    </TableCell>
                    <TableCell className="py-2 pr-0 text-right text-black">
                      R$ {val.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <h4 className="font-bold border-b pb-2 mb-2 text-lg">Despesas</h4>
            <Table>
              <TableBody>
                {Object.entries(expenseByCategory).map(([cat, val]) => (
                  <TableRow key={cat} className="border-b border-gray-200">
                    <TableCell className="py-2 pl-0 font-medium text-black">
                      {cat}
                    </TableCell>
                    <TableCell className="py-2 pr-0 text-right text-black">
                      R$ {val.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-400">
          <p>
            Documento gerado eletronicamente -{' '}
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}
