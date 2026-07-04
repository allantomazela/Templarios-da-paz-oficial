import { useEffect, useMemo, useRef, useState } from 'react'
import { format, isWithinInterval } from 'date-fns'
import { useReactToPrint } from 'react-to-print'
import { Download, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { BankAccount, Transaction } from '@/lib/data'
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import {
  buildAllMembershipSchedules,
  type BrotherMembershipSchedule,
} from '@/lib/membership-schedule'
import {
  fetchApprovedBrothers,
  fetchContributionsWithProfiles,
  fetchContributionNotesByTransactionIds,
  fetchMembershipFeeSettings,
} from '@/lib/contribution-payments'
import {
  fetchForecastItems,
  fetchForecastMonthOverridesForRange,
  fetchMembershipForecastOverridesForRange,
  fetchTransactionsForForecast,
} from '@/lib/forecast-items-api'
import {
  buildForecastProjection,
  getForecastMonthRange,
} from '@/lib/forecast-projection'
import type { ForecastComparisonRow } from '@/lib/forecast-types'
import {
  computeAccountPeriodBreakdown,
  filterTransactionsInPeriod,
} from '@/lib/cash-flow'
import {
  DEFAULT_FINANCIAL_REPORT_PERIOD_CONFIG,
  getFinancialReportPeriodLabelFromConfig,
  resolveFinancialReportDateRange,
  validateFinancialReportPeriodConfig,
  type FinancialReportPeriodConfig,
} from '@/lib/financial-report-period'
import {
  buildPendingItemsFromForecastRows,
  buildPendingItemsFromMembershipSchedules,
  filterPendingItemsByDueDateRange,
  mergePendingFinancialItems,
  summarizePendingFinancialItems,
} from '@/lib/financial-pending-report'
import {
  DEFAULT_FINANCIAL_CUSTOM_REPORT_DISPLAY_OPTIONS,
  FINANCIAL_CUSTOM_REPORT_CONTENT_MODE_LABELS,
  hasVisibleFinancialCustomReportSection,
  resolveFinancialCustomReportDisplay,
  type FinancialCustomReportContentMode,
  type FinancialCustomReportDisplayOptions,
} from '@/lib/financial-custom-report-display'
import { parseCalendarDate } from '@/lib/format-utils'
import useFinancialStore from '@/stores/useFinancialStore'
import { FinancialReportPeriodSelector } from '@/components/financial/FinancialReportPeriodSelector'
import { FinancialCustomReportContentOptions } from '@/components/financial/FinancialCustomReportContentOptions'
import { FinancialCustomReportDocument } from '@/components/financial/FinancialCustomReportDocument'
import { BALANCETE_TYPE_FILTER_LABELS, type BalanceteTypeFilter } from '@/lib/accounting-balancete'
import { fetchAttachmentsByTransactionIds, type FinancialTransactionAttachment } from '@/lib/financial-attachments'
import { exportCustomFinancialReportZip } from '@/lib/financial-custom-report-export'

const CUSTOM_REPORT_PRINT_STYLE = `
  @page { size: A4 landscape; margin: 10mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`

interface FinancialCustomReportProps {
  periodConfig?: FinancialReportPeriodConfig
  onPeriodConfigChange?: (config: FinancialReportPeriodConfig) => void
}

export function FinancialCustomReport({
  periodConfig: periodConfigProp,
  onPeriodConfigChange,
}: FinancialCustomReportProps) {
  const { toast } = useToast()
  const dataRevision = useFinancialStore((state) => state.dataRevision)
  const storeAccounts = useFinancialStore((state) => state.accounts)

  const [internalPeriodConfig, setInternalPeriodConfig] = useState(
    DEFAULT_FINANCIAL_REPORT_PERIOD_CONFIG,
  )
  const periodConfig = periodConfigProp ?? internalPeriodConfig
  const setPeriodConfig = onPeriodConfigChange ?? setInternalPeriodConfig

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [membershipSchedules, setMembershipSchedules] = useState<BrotherMembershipSchedule[]>([])
  const [forecastRows, setForecastRows] = useState<ForecastComparisonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [contentMode, setContentMode] =
    useState<FinancialCustomReportContentMode>('both')
  const [accountFilter, setAccountFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<BalanceteTypeFilter>('all')
  const [displayOptions, setDisplayOptions] = useState<FinancialCustomReportDisplayOptions>(
    DEFAULT_FINANCIAL_CUSTOM_REPORT_DISPLAY_OPTIONS,
  )
  const [contributionNotesByTransactionId, setContributionNotesByTransactionId] =
    useState<Record<string, string>>({})
  const [exportingZip, setExportingZip] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const periodError = validateFinancialReportPeriodConfig(periodConfig)
  const dateRange = useMemo(
    () => resolveFinancialReportDateRange(periodConfig),
    [periodConfig],
  )
  const periodLabel = useMemo(
    () => getFinancialReportPeriodLabelFromConfig(periodConfig),
    [periodConfig],
  )
  const resolvedDisplay = useMemo(
    () => resolveFinancialCustomReportDisplay(displayOptions, contentMode),
    [displayOptions, contentMode],
  )

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      try {
        const monthRange = getForecastMonthRange(new Date(), 12)
        const [
          financialData,
          forecastItems,
          forecastTransactions,
          contribResult,
          brothers,
          feeSettings,
          monthOverrides,
          membershipOverrides,
        ] = await Promise.all([
          fetchFinancialAccountsAndTransactions(),
          fetchForecastItems(),
          fetchTransactionsForForecast(),
          fetchContributionsWithProfiles(),
          fetchApprovedBrothers(),
          fetchMembershipFeeSettings(),
          fetchForecastMonthOverridesForRange(monthRange),
          fetchMembershipForecastOverridesForRange(monthRange),
        ])

        const resolvedAccounts =
          financialData.accounts.length > 0 ? financialData.accounts : storeAccounts
        const schedules = buildAllMembershipSchedules(
          contribResult.contributions,
          brothers,
          contribResult.brotherNames,
          feeSettings,
        )

        const projection = buildForecastProjection({
          referenceDate: new Date(),
          horizonMonths: 12,
          items: forecastItems.filter((item) => item.isActive),
          monthOverrides,
          membershipOverrides,
          membershipSchedules: schedules,
          transactions: forecastTransactions,
          accounts: resolvedAccounts,
        })

        if (!isMounted) return

        setAccounts(resolvedAccounts)
        setTransactions(financialData.transactions)
        setMembershipSchedules(schedules)
        setForecastRows(projection.months.flatMap((month) => month.rows))
      } catch (error) {
        console.error('Error loading custom financial report:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados do relatório personalizado.',
          variant: 'destructive',
        })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [dataRevision, storeAccounts, toast])

  const pendingItems = useMemo(() => {
    if (!dateRange) return []

    const items = mergePendingFinancialItems(
      buildPendingItemsFromForecastRows(forecastRows),
      buildPendingItemsFromMembershipSchedules(membershipSchedules),
    )

    return filterPendingItemsByDueDateRange(items, dateRange)
  }, [dateRange, forecastRows, membershipSchedules])

  const pendingSummary = useMemo(
    () => summarizePendingFinancialItems(pendingItems),
    [pendingItems],
  )

  const filteredTransactions = useMemo(() => {
    let rows = transactions

    if (dateRange) {
      rows = rows.filter((transaction) => {
        const transactionDate = parseCalendarDate(transaction.date)
        if (!transactionDate) return false
        return isWithinInterval(transactionDate, {
          start: dateRange.start,
          end: dateRange.end,
        })
      })
    }

    if (accountFilter !== 'all') {
      rows = rows.filter((transaction) => transaction.accountId === accountFilter)
    }

    if (typeFilter !== 'all') {
      rows = rows.filter((transaction) => transaction.type === typeFilter)
    }

    return rows
  }, [transactions, dateRange, accountFilter, typeFilter])

  useEffect(() => {
    if (!resolvedDisplay.showRealizedLedger || filteredTransactions.length === 0) {
      setContributionNotesByTransactionId({})
      return
    }

    let isMounted = true
    void fetchContributionNotesByTransactionIds(
      filteredTransactions.map((transaction) => transaction.id),
    )
      .then((notes) => {
        if (isMounted) setContributionNotesByTransactionId(notes)
      })
      .catch(() => {
        if (isMounted) setContributionNotesByTransactionId({})
      })

    return () => {
      isMounted = false
    }
  }, [filteredTransactions, resolvedDisplay.showRealizedLedger])

  const transactionsForReport = useMemo(() => {
    return filteredTransactions.map((transaction) => {
      const note = contributionNotesByTransactionId[transaction.id]
      if (!note || transaction.attachmentNotes?.trim()) return transaction
      return { ...transaction, attachmentNotes: note }
    })
  }, [filteredTransactions, contributionNotesByTransactionId])

  const incomeByCategory = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => transaction.type === 'Receita')
      .reduce<{ category: string; amount: number }[]>((accumulator, transaction) => {
        const found = accumulator.find((item) => item.category === transaction.category)
        if (found) found.amount += transaction.amount
        else accumulator.push({ category: transaction.category, amount: transaction.amount })
        return accumulator
      }, [])
  }, [filteredTransactions])

  const expenseByCategory = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => transaction.type === 'Despesa')
      .reduce<{ category: string; amount: number }[]>((accumulator, transaction) => {
        const found = accumulator.find((item) => item.category === transaction.category)
        if (found) found.amount += transaction.amount
        else accumulator.push({ category: transaction.category, amount: transaction.amount })
        return accumulator
      }, [])
  }, [filteredTransactions])

  const accountBreakdown = useMemo(() => {
    const periodTransactions = dateRange
      ? filterTransactionsInPeriod(transactions, dateRange, accountFilter)
      : accountFilter === 'all'
        ? transactions
        : transactions.filter((transaction) => transaction.accountId === accountFilter)

    const filteredAccounts =
      accountFilter === 'all'
        ? accounts
        : accounts.filter((account) => account.id === accountFilter)

    return computeAccountPeriodBreakdown(filteredAccounts, periodTransactions)
  }, [accounts, transactions, dateRange, accountFilter])

  const realizedTotals = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((transaction) => transaction.type === 'Receita')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const totalExpense = filteredTransactions
      .filter((transaction) => transaction.type === 'Despesa')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    }
  }, [filteredTransactions])

  const hasData =
    (contentMode !== 'pending' && filteredTransactions.length > 0) ||
    (contentMode !== 'realized' && pendingItems.length > 0)

  const canRender =
    !periodError && hasData && hasVisibleFinancialCustomReportSection(resolvedDisplay)

  const accountFilterLabel =
    accountFilter === 'all'
      ? undefined
      : accounts.find((account) => account.id === accountFilter)?.name

  const accountNames = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.id, account.name])),
    [accounts],
  )

  const handleExportZip = async () => {
    setExportingZip(true)
    try {
      let attachmentsByTransactionId: Record<string, FinancialTransactionAttachment[]> = {}

      if (resolvedDisplay.showRealizedLedger && transactionsForReport.length > 0) {
        attachmentsByTransactionId = await fetchAttachmentsByTransactionIds(
          transactionsForReport.map((transaction) => transaction.id),
        )
      }

      await exportCustomFinancialReportZip({
        periodLabel,
        contentModeLabel: FINANCIAL_CUSTOM_REPORT_CONTENT_MODE_LABELS[contentMode],
        accountFilterLabel,
        typeFilterLabel: BALANCETE_TYPE_FILTER_LABELS[typeFilter],
        display: resolvedDisplay,
        pendingItems,
        pendingSummary,
        realizedTotals,
        incomeByCategory,
        expenseByCategory,
        accountBreakdown,
        transactions: transactionsForReport,
        accountNames,
        attachmentsByTransactionId,
      })

      toast({
        title: 'Pacote ZIP gerado',
        description:
          'O download inclui CSVs do relatório personalizado e comprovantes dos lançamentos, quando houver.',
      })
    } catch (error) {
      console.error('Error exporting custom financial report zip:', error)
      toast({
        title: 'Erro ao exportar ZIP',
        description: 'Não foi possível montar o pacote do relatório. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setExportingZip(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: `Relatorio_Financeiro_Personalizado_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: CUSTOM_REPORT_PRINT_STYLE,
    onAfterPrint: () => {
      toast({
        title: 'Relatório enviado à impressão',
        description: 'Use "Salvar como PDF" na janela de impressão.',
      })
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando relatório personalizado...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="no-print space-y-4">
        <div>
          <h3 className="text-lg font-medium">Relatório Personalizado</h3>
          <p className="text-sm text-muted-foreground">
            Escolha período por data, inclua valores a vencer e personalize as seções do
            documento.
          </p>
        </div>

        <FinancialReportPeriodSelector value={periodConfig} onChange={setPeriodConfig} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Conteúdo</Label>
            <Select
              value={contentMode}
              onValueChange={(value) =>
                setContentMode(value as FinancialCustomReportContentMode)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FINANCIAL_CUSTOM_REPORT_CONTENT_MODE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tipo (realizado)</Label>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as BalanceteTypeFilter)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BALANCETE_TYPE_FILTER_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Conta (realizado)</Label>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <FinancialCustomReportContentOptions
          options={displayOptions}
          onChange={setDisplayOptions}
        />

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={!canRender || exportingZip}
            onClick={() => void handleExportZip()}
          >
            {exportingZip ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Exportar ZIP
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={!canRender || exportingZip}
            onClick={() => handlePrint()}
          >
            <Download className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {periodError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {periodError}
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum dado encontrado para os filtros selecionados ({periodLabel}).
          </CardContent>
        </Card>
      ) : !hasVisibleFinancialCustomReportSection(resolvedDisplay) ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos uma seção em &quot;Conteúdo do relatório&quot;.
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="no-print">
            <CardTitle className="text-base">Pré-visualização</CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
              <div id="financial-custom-report-container" ref={previewRef}>
                <FinancialCustomReportDocument
                  title="Relatório Financeiro Personalizado"
                  periodLabel={periodLabel}
                  contentModeLabel={FINANCIAL_CUSTOM_REPORT_CONTENT_MODE_LABELS[contentMode]}
                  accountFilterLabel={accountFilterLabel}
                  display={resolvedDisplay}
                  pendingItems={pendingItems}
                  pendingSummary={pendingSummary}
                  realizedTotals={realizedTotals}
                  incomeByCategory={incomeByCategory}
                  expenseByCategory={expenseByCategory}
                  accountBreakdown={accountBreakdown}
                  transactions={transactionsForReport}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
