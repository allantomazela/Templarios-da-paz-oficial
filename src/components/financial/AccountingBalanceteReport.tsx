import { useEffect, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Download, Loader2, Package } from 'lucide-react'
import type { BankAccount, Transaction } from '@/lib/data'
import {
  BALANCETE_TYPE_FILTER_LABELS,
  buildAccountingBalancete,
  buildAccountingBalanceteAllPeriods,
  filterTransactionsForBalancetePeriod,
  type BalanceteTypeFilter,
} from '@/lib/accounting-balancete'
import {
  fetchAttachmentsByTransactionIds,
  type FinancialTransactionAttachment,
} from '@/lib/financial-attachments'
import { fetchContributionNotesByTransactionIds } from '@/lib/contribution-payments'
import {
  getFinancialReportPeriodLabelFromConfig,
  resolveFinancialReportDateRange,
  type FinancialReportPeriodConfig,
} from '@/lib/financial-report-period'
import {
  DEFAULT_BALANCETE_DISPLAY_OPTIONS,
  hasVisibleBalanceteSection,
  resolveBalanceteDisplayOptions,
  type BalanceteReportDisplayOptions,
} from '@/lib/balancete-report-display'
import { BalancetePrintDocument } from '@/components/financial/BalancetePrintDocument'
import { BalanceteReportContentOptions } from '@/components/financial/BalanceteReportContentOptions'
import { exportBalanceteZip } from '@/lib/balancete-zip-export'
import { useToast } from '@/hooks/use-toast'

const BALANCETE_PRINT_PAGE_STYLE = `
  @page { size: A4 landscape; margin: 10mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`

interface AccountingBalanceteReportProps {
  accounts: BankAccount[]
  transactions: Transaction[]
  periodConfig: FinancialReportPeriodConfig
  periodError?: string | null
  loading?: boolean
}

export function AccountingBalanceteReport({
  accounts,
  transactions,
  periodConfig,
  periodError = null,
  loading = false,
}: AccountingBalanceteReportProps) {
  const [accountFilter, setAccountFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<BalanceteTypeFilter>('all')
  const [displayOptions, setDisplayOptions] = useState<BalanceteReportDisplayOptions>(
    DEFAULT_BALANCETE_DISPLAY_OPTIONS,
  )
  const [attachmentsByTransactionId, setAttachmentsByTransactionId] = useState<
    Record<string, FinancialTransactionAttachment[]>
  >({})
  const [contributionNotesByTransactionId, setContributionNotesByTransactionId] =
    useState<Record<string, string>>({})
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [exportingZip, setExportingZip] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const dateRange = useMemo(
    () => resolveFinancialReportDateRange(periodConfig),
    [periodConfig],
  )
  const periodLabel = useMemo(
    () => getFinancialReportPeriodLabelFromConfig(periodConfig),
    [periodConfig],
  )
  const resolvedDisplay = useMemo(
    () => resolveBalanceteDisplayOptions(displayOptions, typeFilter),
    [displayOptions, typeFilter],
  )

  const relevantTransactions = useMemo(
    () =>
      filterTransactionsForBalancetePeriod(
        transactions,
        dateRange,
        accountFilter,
        typeFilter,
      ),
    [transactions, dateRange, accountFilter, typeFilter],
  )

  useEffect(() => {
    let isMounted = true

    const loadAttachments = async () => {
      const needsLedgerDetails =
        resolvedDisplay.showLedger && resolvedDisplay.showAttachmentDetails

      if (!needsLedgerDetails) {
        if (isMounted) {
          setAttachmentsByTransactionId({})
          setContributionNotesByTransactionId({})
        }
        return
      }

      const transactionIds = relevantTransactions.map((transaction) => transaction.id)
      if (transactionIds.length === 0) {
        if (isMounted) {
          setAttachmentsByTransactionId({})
          setContributionNotesByTransactionId({})
        }
        return
      }

      setAttachmentsLoading(true)
      try {
        const [grouped, contributionNotes] = await Promise.all([
          fetchAttachmentsByTransactionIds(transactionIds),
          fetchContributionNotesByTransactionIds(transactionIds),
        ])
        if (isMounted) {
          setAttachmentsByTransactionId(grouped)
          setContributionNotesByTransactionId(contributionNotes)
        }
      } catch (error) {
        console.error('Error loading balancete attachments:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar comprovantes do balancete.',
          variant: 'destructive',
        })
      } finally {
        if (isMounted) setAttachmentsLoading(false)
      }
    }

    void loadAttachments()

    return () => {
      isMounted = false
    }
  }, [relevantTransactions, resolvedDisplay.showLedger, resolvedDisplay.showAttachmentDetails, toast])

  const balancete = useMemo(() => {
    if (dateRange) {
      return buildAccountingBalancete(
        accounts,
        transactions,
        attachmentsByTransactionId,
        dateRange,
        accountFilter,
        typeFilter,
        contributionNotesByTransactionId,
      )
    }

    return buildAccountingBalanceteAllPeriods(
      accounts,
      transactions,
      attachmentsByTransactionId,
      accountFilter,
      typeFilter,
      contributionNotesByTransactionId,
    )
  }, [
    accounts,
    transactions,
    attachmentsByTransactionId,
    contributionNotesByTransactionId,
    dateRange,
    accountFilter,
    typeFilter,
  ])

  const accountFilterLabel =
    accountFilter === 'all'
      ? undefined
      : accounts.find((account) => account.id === accountFilter)?.name

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: `Balancete_Contabil_${periodConfig.period}_${typeFilter}`,
    pageStyle: BALANCETE_PRINT_PAGE_STYLE,
    onAfterPrint: () => {
      toast({
        title: 'Balancete enviado à impressão',
        description: 'Use "Salvar como PDF" na janela de impressão para gerar o arquivo.',
      })
    },
    onPrintError: () => {
      toast({
        title: 'Erro ao imprimir',
        description: 'Não foi possível gerar o balancete. Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const isBusy = loading || attachmentsLoading
  const hasData = balancete.periodTransactionCount > 0
  const canRenderReport =
    !periodError && hasData && hasVisibleBalanceteSection(resolvedDisplay)

  const handleExportZip = async () => {
    setExportingZip(true)
    try {
      await exportBalanceteZip({
        balancete,
        periodLabel,
        accountFilterLabel,
        typeFilterLabel: BALANCETE_TYPE_FILTER_LABELS[typeFilter],
        attachmentsByTransactionId,
      })
      toast({
        title: 'Pacote ZIP gerado',
        description:
          'O download inclui CSVs do balancete e os comprovantes anexados no período.',
      })
    } catch (error) {
      console.error('Error exporting balancete zip:', error)
      toast({
        title: 'Erro ao exportar ZIP',
        description: 'Não foi possível montar o pacote contábil. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setExportingZip(false)
    }
  }

  const previewDescription = [
    periodLabel,
    BALANCETE_TYPE_FILTER_LABELS[typeFilter],
    accountFilterLabel,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-4">
      <div className="no-print space-y-4">
        <div>
          <h3 className="text-lg font-medium">Balancete Contábil</h3>
          <p className="text-sm text-muted-foreground">
            Configure filtros e seções do relatório. A pré-visualização reflete exatamente o
            PDF gerado na impressão.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:max-w-2xl">
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="balancete-type-filter" className="text-xs text-muted-foreground">
                Tipo
              </Label>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as BalanceteTypeFilter)}
              >
                <SelectTrigger id="balancete-type-filter">
                  <SelectValue placeholder="Tipo" />
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

            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="balancete-account-filter" className="text-xs text-muted-foreground">
                Conta
              </Label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger id="balancete-account-filter">
                  <SelectValue placeholder="Conta" />
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

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handlePrint()}
              disabled={!canRenderReport || isBusy || exportingZip}
              className="gap-2"
              variant="outline"
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Imprimir / Salvar PDF
            </Button>
            <Button
              onClick={() => void handleExportZip()}
              disabled={!hasData || isBusy || exportingZip}
              className="gap-2"
            >
              {exportingZip ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              Exportar ZIP
            </Button>
          </div>
        </div>

        <BalanceteReportContentOptions
          options={displayOptions}
          typeFilter={typeFilter}
          onChange={setDisplayOptions}
        />
      </div>

      <Card className="no-print overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Pré-visualização</CardTitle>
          <CardDescription>{previewDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isBusy ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando balancete...
            </div>
          ) : periodError ? (
            <p className="px-6 py-8 text-center text-sm text-destructive sm:px-0">
              {periodError}
            </p>
          ) : !hasData ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              Nenhum lançamento encontrado para os filtros selecionados.
            </p>
          ) : !hasVisibleBalanceteSection(resolvedDisplay) ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              Selecione ao menos uma seção em &quot;Conteúdo do relatório&quot; para visualizar
              ou imprimir.
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
              <div id="financial-balancete-container" ref={previewRef}>
                <BalancetePrintDocument
                  title="Balancete Contábil"
                  periodLabel={periodLabel}
                  accountFilterLabel={accountFilterLabel}
                  data={balancete}
                  display={resolvedDisplay}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
