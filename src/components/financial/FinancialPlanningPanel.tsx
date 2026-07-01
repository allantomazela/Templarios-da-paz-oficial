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
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {projection.accountProjections.map((account) => (
              <div key={account.accountId} className="rounded-lg border p-4">
                <p className="font-medium">{account.accountName}</p>
                <p className="text-sm text-muted-foreground">
                  Atual: {formatCurrencyBRL(account.currentBalance)}
                </p>
                <p className="text-lg font-semibold">
                  Projetado: {formatCurrencyBRL(account.projectedBalance)}
                </p>
              </div>
            ))}
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
              <div className="text-sm text-muted-foreground">
                Previsto líquido: {formatCurrencyBRL(selectedMonth.netExpected)} · Realizado
                líquido: {formatCurrencyBRL(selectedMonth.netRealized)}
                {selectedMonthEconomy > 0
                  ? ` · Economia: ${formatCurrencyBRL(selectedMonthEconomy)}`
                  : ''}
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
