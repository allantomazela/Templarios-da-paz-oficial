import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Pie, PieChart } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  Download,
  Filter,
  BarChart3,
  AlertCircle,
  Calendar,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { logDebug } from '@/lib/logger'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  format,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
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

export function FinancialReports() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [period, setPeriod] = useState('current_month')
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
  const [exportFields, setExportFields] = useState({
    id: true,
    date: true,
    description: true,
    category: true,
    amount: true,
    type: true,
    timestamp: false,
    statusHistory: false,
  })

  // Função para obter o intervalo de datas baseado no período selecionado
  const getDateRange = () => {
    const now = new Date()
    switch (period) {
      case 'current_month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        }
      case 'last_month':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1)),
        }
      case 'current_year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
        }
      case 'all':
      default:
        return null // null significa todos os dados
    }
  }

  // Filtrar transações por período
  const filteredTransactions = useMemo(() => {
    const dateRange = getDateRange()
    if (!dateRange) return transactions

    return transactions.filter((t) => {
      try {
        const transactionDate = parseISO(t.date)
        return isWithinInterval(transactionDate, {
          start: dateRange.start,
          end: dateRange.end,
        })
      } catch {
        return false
      }
    })
  }, [transactions, period])

  // Agregar dados para os gráficos
  const incomeByCategory = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === 'Receita')
    if (income.length === 0) return []

    return income
      .reduce(
        (acc, curr) => {
          const found = acc.find((i) => i.category === curr.category)
          if (found) found.amount += curr.amount
          else acc.push({ category: curr.category, amount: curr.amount })
          return acc
        },
        [] as { category: string; amount: number; fill?: string }[],
      )
      .map((i, index) => ({
        ...i,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
  }, [filteredTransactions])

  const expenseByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'Despesa')
    if (expenses.length === 0) return []

    return expenses
      .reduce(
        (acc, curr) => {
          const found = acc.find((i) => i.category === curr.category)
          if (found) found.amount += curr.amount
          else acc.push({ category: curr.category, amount: curr.amount })
          return acc
        },
        [] as { category: string; amount: number; fill?: string }[],
      )
      .map((i, index) => ({
        ...i,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
  }, [filteredTransactions])

  const hasIncome = incomeByCategory.length > 0
  const hasExpenses = expenseByCategory.length > 0
  const hasAnyData = hasIncome || hasExpenses

  const pieConfig = {
    amount: { label: 'Valor' },
  }

  const handleExportClick = () => {
    if (!hasAnyData) {
      toast({
        variant: 'destructive',
        title: 'Nenhum dado para exportar',
        description:
          'Cadastre receitas ou despesas antes de exportar um relatório.',
      })
      return
    }
    setIsExportDialogOpen(true)
  }

  const confirmExport = () => {
    const selected = Object.keys(exportFields).filter(
      (k) => exportFields[k as keyof typeof exportFields],
    )
    logDebug('Exporting with fields', { selected })
    toast({
      title: 'Relatório Gerado',
      description: `Relatório exportado com ${selected.length} campos selecionados.`,
    })
    setIsExportDialogOpen(false)
  }

  const getPeriodLabel = () => {
    const dateRange = getDateRange()
    if (!dateRange) return 'Todos os períodos'

    return `${format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} - ${format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando relatórios financeiros...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Relatórios Financeiros</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize a distribuição de receitas e despesas por categoria
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="current_year">Ano Atual</SelectItem>
              <SelectItem value="all">Todos os Períodos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportClick}
            variant="outline"
            disabled={!hasAnyData}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar Relatório
          </Button>
        </div>
      </div>

      {!hasAnyData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold mb-2">
              Nenhum dado disponível
            </h4>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              {filteredTransactions.length === 0 && transactions.length > 0
                ? `Não há transações no período selecionado (${getPeriodLabel()}). Tente selecionar outro período.`
                : 'Cadastre receitas ou despesas para visualizar os relatórios financeiros. Os gráficos serão gerados automaticamente.'}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>
                {transactions.length === 0
                  ? 'Nenhuma transação cadastrada no sistema'
                  : `${transactions.length} transação(ões) cadastrada(s) no total`}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Receitas por Categoria</CardTitle>
                  <CardDescription className="mt-1">
                    {getPeriodLabel()}
                  </CardDescription>
                </div>
                {!hasIncome && (
                  <div className="rounded-full bg-yellow-100 p-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hasIncome ? (
                <ChartContainer
                  config={pieConfig}
                  className="mx-auto aspect-square max-h-[300px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={incomeByCategory}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={60}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma receita no período selecionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Despesas por Categoria</CardTitle>
                  <CardDescription className="mt-1">
                    {getPeriodLabel()}
                  </CardDescription>
                </div>
                {!hasExpenses && (
                  <div className="rounded-full bg-yellow-100 p-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hasExpenses ? (
                <ChartContainer
                  config={pieConfig}
                  className="mx-auto aspect-square max-h-[300px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={expenseByCategory}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={60}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma despesa no período selecionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo estatístico */}
      {hasAnyData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total de Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  incomeByCategory.reduce((sum, item) => sum + item.amount, 0),
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {incomeByCategory.length} categoria(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  expenseByCategory.reduce((sum, item) => sum + item.amount, 0),
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {expenseByCategory.length} categoria(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  incomeByCategory.reduce((sum, item) => sum + item.amount, 0) -
                    expenseByCategory.reduce(
                      (sum, item) => sum + item.amount,
                      0,
                    ) >=
                  0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  incomeByCategory.reduce((sum, item) => sum + item.amount, 0) -
                    expenseByCategory.reduce(
                      (sum, item) => sum + item.amount,
                      0,
                    ),
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredTransactions.length} transação(ões) no período
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opções de Exportação</DialogTitle>
            <DialogDescription>
              Selecione os campos detalhados para incluir no relatório.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-id"
                checked={exportFields.id}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, id: !!c })
                }
              />
              <Label htmlFor="field-id">ID da Transação</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-date"
                checked={exportFields.date}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, date: !!c })
                }
              />
              <Label htmlFor="field-date">Data</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-desc"
                checked={exportFields.description}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, description: !!c })
                }
              />
              <Label htmlFor="field-desc">Descrição</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-cat"
                checked={exportFields.category}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, category: !!c })
                }
              />
              <Label htmlFor="field-cat">Categoria</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-amt"
                checked={exportFields.amount}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, amount: !!c })
                }
              />
              <Label htmlFor="field-amt">Valor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-type"
                checked={exportFields.type}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, type: !!c })
                }
              />
              <Label htmlFor="field-type">Tipo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-ts"
                checked={exportFields.timestamp}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, timestamp: !!c })
                }
              />
              <Label htmlFor="field-ts">Timestamp (Criação)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="field-hist"
                checked={exportFields.statusHistory}
                onCheckedChange={(c) =>
                  setExportFields({ ...exportFields, statusHistory: !!c })
                }
              />
              <Label htmlFor="field-hist">Histórico de Status</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={confirmExport}>Exportar PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
