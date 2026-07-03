import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import useFinancialStore from '@/stores/useFinancialStore'
import { buildAllMembershipSchedules } from '@/lib/membership-schedule'
import {
  fetchApprovedBrothers,
  fetchContributionsWithProfiles,
  fetchMembershipFeeSettings,
} from '@/lib/contribution-payments'
import {
  deleteForecastItem,
  fetchForecastItems,
  fetchForecastMonthOverridesForRange,
  fetchMembershipForecastOverridesForRange,
  fetchTransactionsForForecast,
  saveForecastItem,
  upsertForecastMonthOverride,
  upsertMembershipForecastOverride,
} from '@/lib/forecast-items-api'
import {
  buildForecastProjection,
  computeMonthEconomyTotal,
  getForecastMonthRange,
} from '@/lib/forecast-projection'
import { computeTotalEconomyAcrossMonths } from '@/lib/forecast-report-export'
import type {
  ForecastComparisonRow,
  ForecastItem,
  ForecastMonthOverride,
  MembershipForecastOverride,
} from '@/lib/forecast-types'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { ForecastItemsManager } from '@/components/financial/ForecastItemsManager'
import {
  ForecastItemDialog,
  type ForecastItemFormValues,
} from '@/components/financial/ForecastItemDialog'
import { ForecastComparisonTable } from '@/components/financial/ForecastComparisonTable'
import { ForecastOverrideDialog } from '@/components/financial/ForecastOverrideDialog'
import { ForecastPlanningReport } from '@/components/financial/ForecastPlanningReport'
import { PayableDialog, type PayableFormValues } from '@/components/financial/PayableDialog'
import { createPayableFromForecast } from '@/lib/financial-payables-api'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PlanningDataSnapshot {
  items: ForecastItem[]
  monthOverrides: ForecastMonthOverride[]
  membershipOverrides: MembershipForecastOverride[]
  membershipSchedules: BrotherMembershipSchedule[]
  transactions: Awaited<ReturnType<typeof fetchTransactionsForForecast>>
}

export function FinancialPlanningPanel() {
  const { toast } = useToast()
  const categories = useFinancialStore((state) => state.categories)
  const accounts = useFinancialStore((state) => state.accounts)
  const [items, setItems] = useState<ForecastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ForecastItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<ForecastItem | null>(null)
  const [overrideRow, setOverrideRow] = useState<ForecastComparisonRow | null>(null)
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [payableDialogOpen, setPayableDialogOpen] = useState(false)
  const [payableDefaults, setPayableDefaults] = useState<Partial<
    PayableFormValues & { forecastItemId?: string }
  > | null>(null)
  const [projectionInput, setProjectionInput] = useState<PlanningDataSnapshot | null>(null)

  const monthRange = useMemo(() => getForecastMonthRange(new Date(), 3), [])

  const loadPlanningData = useAsyncOperation(
    async () => {
      setLoading(true)
      const [forecastItems, transactions, contribResult, brothers, feeSettings] =
        await Promise.all([
          fetchForecastItems(),
          fetchTransactionsForForecast(),
          fetchContributionsWithProfiles(),
          fetchApprovedBrothers(),
          fetchMembershipFeeSettings(),
        ])

      const membershipSchedules = buildAllMembershipSchedules(
        contribResult.contributions,
        brothers,
        contribResult.brotherNames,
        feeSettings,
      )

      const [monthOverrides, membershipOverrides] = await Promise.all([
        fetchForecastMonthOverridesForRange(monthRange),
        fetchMembershipForecastOverridesForRange(monthRange),
      ])

      setItems(forecastItems)
      setLoading(false)

      return {
        items: forecastItems,
        monthOverrides,
        membershipOverrides,
        membershipSchedules,
        transactions,
      }
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar planejamento financeiro.',
    },
  )

  useEffect(() => {
    void useFinancialStore.getState().fetchCategories()
    void useFinancialStore.getState().fetchAccounts()
    void loadPlanningData.execute().then((result) => {
      if (result) setProjectionInput(result)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const projection = useMemo(() => {
    if (!projectionInput) return null
    return buildForecastProjection({
      items: projectionInput.items.filter((item) => item.isActive),
      monthOverrides: projectionInput.monthOverrides,
      membershipOverrides: projectionInput.membershipOverrides,
      membershipSchedules: projectionInput.membershipSchedules,
      transactions: projectionInput.transactions,
      accounts,
    })
  }, [projectionInput, accounts])

  const selectedMonth = projection?.months[selectedMonthIndex]
  const totalEconomy = useMemo(
    () => (projection ? computeTotalEconomyAcrossMonths(projection.months) : 0),
    [projection],
  )
  const selectedMonthEconomy = useMemo(
    () => (selectedMonth ? computeMonthEconomyTotal(selectedMonth.rows) : 0),
    [selectedMonth],
  )

  const refresh = async () => {
    const result = await loadPlanningData.execute()
    if (result) setProjectionInput(result)
  }

  const saveItemOperation = useAsyncOperation(
    async (values: ForecastItemFormValues) => {
      await saveForecastItem(
        {
          description: values.description,
          type: values.type,
          categoryId: values.categoryId || null,
          expectedAmount: values.expectedAmount,
          dueDay: values.dueDay,
          recurrence: values.recurrence,
          recurrenceMonth: values.recurrenceMonth ?? null,
          preferredAccountId: values.preferredAccountId || null,
          isActive: values.isActive,
          notes: values.notes,
        },
        selectedItem?.id,
      )
      await refresh()
    },
    {
      successMessage: 'Conta fixa salva com sucesso!',
      errorMessage: 'Falha ao salvar conta fixa.',
    },
  )

  const deleteItemOperation = useAsyncOperation(
    async (item: ForecastItem) => {
      await deleteForecastItem(item.id)
      await refresh()
    },
    {
      successMessage: 'Conta fixa removida.',
      errorMessage: 'Falha ao remover conta fixa.',
    },
  )

  const savePayableOperation = useAsyncOperation(
    async (values: PayableFormValues) => {
      if (!payableDefaults?.forecastItemId) {
        throw new Error('Item de planejamento não identificado.')
      }
      const forecastItem = items.find((item) => item.id === payableDefaults.forecastItemId)
      if (!forecastItem?.categoryId) {
        throw new Error('A conta fixa precisa de uma categoria de despesa para gerar conta a pagar.')
      }
      await createPayableFromForecast({
        description: values.description,
        categoryId: values.categoryId || forecastItem.categoryId,
        amount: values.amount,
        dueDate: values.dueDate,
        forecastItemId: payableDefaults.forecastItemId,
        notes: values.notes,
      })
      setPayableDefaults(null)
      notifyFinancialDataChanged()
      toast({
        title: 'Conta a pagar criada',
        description: 'Acompanhe em Financeiro → Contas a pagar.',
      })
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao criar conta a pagar.',
    },
  )

  const handleCreatePayableFromForecast = (row: ForecastComparisonRow) => {
    if (!row.forecastItemId || row.type !== 'Despesa') return
    const forecastItem = items.find((item) => item.id === row.forecastItemId)
    if (!forecastItem?.categoryId) {
      toast({
        title: 'Categoria obrigatória',
        description: 'Edite a conta fixa e associe uma categoria de despesa antes de continuar.',
        variant: 'destructive',
      })
      return
    }
    setPayableDefaults({
      description: row.description,
      categoryId: forecastItem.categoryId,
      amount: row.expectedAmount,
      dueDate: row.dueDate,
      forecastItemId: row.forecastItemId,
    })
    setPayableDialogOpen(true)
  }

  const saveOverride = async (values: {
    expectedAmountOverride: number
    notes?: string
  }) => {
    if (!overrideRow) return

    try {
      if (overrideRow.kind === 'membership') {
        await upsertMembershipForecastOverride({
          year: overrideRow.year,
          month: overrideRow.month,
          expectedAmountOverride: values.expectedAmountOverride,
          notes: values.notes,
        })
      } else if (overrideRow.forecastItemId) {
        await upsertForecastMonthOverride({
          forecastItemId: overrideRow.forecastItemId,
          year: overrideRow.year,
          month: overrideRow.month,
          expectedAmountOverride: values.expectedAmountOverride,
          notes: values.notes,
        })
      }
      toast({ title: 'Previsto ajustado para o mês.' })
      await refresh()
    } catch {
      toast({
        title: 'Erro ao salvar ajuste',
        variant: 'destructive',
      })
    }
  }

  if (loading && !projection) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo atual (todas as contas)</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrencyBRL(projection?.globalCurrentBalance ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo projetado (3 meses)</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrencyBRL(projection?.globalProjectedBalance ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contas fixas ativas</CardDescription>
            <CardTitle className="text-2xl">
              {items.filter((item) => item.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={
            totalEconomy > 0
              ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
              : undefined
          }
        >
          <CardHeader className="pb-2">
            <CardDescription>Economia no período</CardDescription>
            <CardTitle
              className={`text-2xl ${
                totalEconomy > 0 ? 'text-green-700 dark:text-green-400' : ''
              }`}
            >
              {formatCurrencyBRL(totalEconomy)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {projection?.accountProjections.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Projeção por conta bancária</CardTitle>
            <CardDescription>
              Saldo atual + receitas previstas − despesas previstas (pendentes nos próximos 3
              meses).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Conta</th>
                    <th className="pb-2 pr-4 text-right font-medium">Saldo atual</th>
                    <th className="pb-2 pr-4 text-right font-medium">Receitas pend.</th>
                    <th className="pb-2 pr-4 text-right font-medium">Despesas pend.</th>
                    <th className="pb-2 text-right font-medium">Saldo projetado</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.accountProjections.map((account) => (
                    <tr key={account.accountId} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{account.accountName}</td>
                      <td className="py-2 pr-4 text-right">
                        {formatCurrencyBRL(account.currentBalance)}
                      </td>
                      <td className="py-2 pr-4 text-right text-green-600">
                        {formatCurrencyBRL(account.expectedIncomeRemaining)}
                      </td>
                      <td className="py-2 pr-4 text-right text-red-600">
                        {formatCurrencyBRL(account.expectedExpenseRemaining)}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {formatCurrencyBRL(account.projectedBalance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="py-2 pr-4">
                      {projection.accountProjectionsTotals.accountName}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {formatCurrencyBRL(projection.accountProjectionsTotals.currentBalance)}
                    </td>
                    <td className="py-2 pr-4 text-right text-green-600">
                      {formatCurrencyBRL(
                        projection.accountProjectionsTotals.expectedIncomeRemaining,
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right text-red-600">
                      {formatCurrencyBRL(
                        projection.accountProjectionsTotals.expectedExpenseRemaining,
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrencyBRL(projection.accountProjectionsTotals.projectedBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">Previsto × Realizado</TabsTrigger>
          <TabsTrigger value="items">Contas fixas</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Select
              value={String(selectedMonthIndex)}
              onValueChange={(value) => setSelectedMonthIndex(Number(value))}
            >
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {monthRange.map((month, index) => (
                  <SelectItem key={`${month.year}-${month.month}`} value={String(index)}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMonth ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Previsto líquido: {formatCurrencyBRL(selectedMonth.netExpected)} · Realizado
                  (planej.): {formatCurrencyBRL(selectedMonth.netRealized)}
                  {selectedMonthEconomy > 0
                    ? ` · Economia: ${formatCurrencyBRL(selectedMonthEconomy)}`
                    : ''}
                </p>
                <p>
                  Caixa do mês (fluxo): receitas{' '}
                  {formatCurrencyBRL(selectedMonth.cashFlow.cashFlowIncome)} · despesas{' '}
                  {formatCurrencyBRL(selectedMonth.cashFlow.cashFlowExpense)} · líquido{' '}
                  {formatCurrencyBRL(selectedMonth.cashFlow.cashFlowNet)}
                  {selectedMonth.cashFlow.unplannedNet !== 0
                    ? ` · fora do previsto: ${formatCurrencyBRL(selectedMonth.cashFlow.unplannedNet)}`
                    : ''}
                </p>
              </div>
            ) : null}
          </div>

          {selectedMonth ? (
            <ForecastComparisonTable
              rows={selectedMonth.rows}
              onEditOverride={(row) => {
                setOverrideRow(row)
                setOverrideDialogOpen(true)
              }}
              onCreatePayable={handleCreatePayableFromForecast}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="items">
          <ForecastItemsManager
            items={items}
            onCreate={() => {
              setSelectedItem(null)
              setItemDialogOpen(true)
            }}
            onEdit={(item) => {
              setSelectedItem(item)
              setItemDialogOpen(true)
            }}
            onDelete={setItemToDelete}
          />
        </TabsContent>

        <TabsContent value="report">
          <ForecastPlanningReport projection={projection} loading={loading} />
        </TabsContent>
      </Tabs>

      <ForecastItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        itemToEdit={selectedItem}
        categories={categories}
        accounts={accounts}
        onSave={(values) => saveItemOperation.execute(values)}
      />

      <ForecastOverrideDialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        row={overrideRow}
        onSave={saveOverride}
      />

      <PayableDialog
        open={payableDialogOpen}
        onOpenChange={(open) => {
          setPayableDialogOpen(open)
          if (!open) setPayableDefaults(null)
        }}
        payableToEdit={null}
        categories={categories}
        defaultValues={payableDefaults ?? undefined}
        saving={savePayableOperation.loading}
        onSave={(values) => savePayableOperation.execute(values)}
      />

      <AlertDialog open={Boolean(itemToDelete)} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta fixa?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete
                ? `A conta "${itemToDelete.description}" será removida do planejamento. Transações já lançadas não serão excluídas.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  void deleteItemOperation.execute(itemToDelete)
                  setItemToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
