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
import { Download, Filter, Loader2, Package } from 'lucide-react'
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
import {
  FINANCIAL_REPORT_PERIOD_LABELS,
  getFinancialReportDateRange,
  getFinancialReportPeriodLabel,
  type FinancialReportPeriodKey,
} from '@/lib/financial-report-period'
import { BalancetePrintDocument } from '@/components/financial/BalancetePrintDocument'
import { exportBalanceteZip } from '@/lib/balancete-zip-export'
import { useToast } from '@/hooks/use-toast'

interface AccountingBalanceteReportProps {
  accounts: BankAccount[]
  transactions: Transaction[]
  period: FinancialReportPeriodKey
  onPeriodChange: (period: FinancialReportPeriodKey) => void
  loading?: boolean
}

export function AccountingBalanceteReport({
  accounts,
  transactions,
  period,
  onPeriodChange,
  loading = false,
}: AccountingBalanceteReportProps) {
  const [accountFilter, setAccountFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<BalanceteTypeFilter>('all')
  const [attachmentsByTransactionId, setAttachmentsByTransactionId] = useState<
    Record<string, FinancialTransactionAttachment[]>
  >({})
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [exportingZip, setExportingZip] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const dateRange = useMemo(() => getFinancialReportDateRange(period), [period])
  const periodLabel = useMemo(() => getFinancialReportPeriodLabel(period), [period])

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
      const transactionIds = relevantTransactions.map((transaction) => transaction.id)
      if (transactionIds.length === 0) {
        if (isMounted) setAttachmentsByTransactionId({})
        return
      }

      setAttachmentsLoading(true)
      try {
        const grouped = await fetchAttachmentsByTransactionIds(transactionIds)
        if (isMounted) setAttachmentsByTransactionId(grouped)
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
  }, [relevantTransactions, toast])

  const balancete = useMemo(() => {
    if (dateRange) {
      return buildAccountingBalancete(
        accounts,
        transactions,
        attachmentsByTransactionId,
        dateRange,
        accountFilter,
        typeFilter,
      )
    }

    return buildAccountingBalanceteAllPeriods(
      accounts,
      transactions,
      attachmentsByTransactionId,
      accountFilter,
      typeFilter,
    )
  }, [
    accounts,
    transactions,
    attachmentsByTransactionId,
    dateRange,
    accountFilter,
    typeFilter,
  ])

  const accountFilterLabel =
    accountFilter === 'all'
      ? undefined
      : accounts.find((account) => account.id === accountFilter)?.name

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Balancete_Contabil_${period}_${typeFilter}`,
    pageStyle: `
      @page { size: A4 landscape; margin: 10mm 12mm; }
      @media print {
        html, body {
          width: 297mm;
          height: 210mm;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
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
            Relatório para contabilidade com filtros por período, conta e tipo de lançamento.
            Imprima em PDF ou exporte ZIP com planilhas e comprovantes.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:max-w-3xl">
            <Select
              value={period}
              onValueChange={(value) => onPeriodChange(value as FinancialReportPeriodKey)}
            >
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FINANCIAL_REPORT_PERIOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as BalanceteTypeFilter)}>
              <SelectTrigger>
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

            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="sm:col-span-2 lg:col-span-1">
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

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handlePrint()}
              disabled={!hasData || isBusy || exportingZip}
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
          ) : !hasData ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              Nenhum lançamento encontrado para os filtros selecionados.
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
              <BalancetePrintDocument
                title="Balancete Contábil"
                periodLabel={periodLabel}
                accountFilterLabel={accountFilterLabel}
                data={balancete}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div id="financial-balancete-container" className="hidden print:block" ref={printRef}>
        <BalancetePrintDocument
          title="Balancete Contábil"
          periodLabel={periodLabel}
          accountFilterLabel={accountFilterLabel}
          data={balancete}
        />
      </div>
    </div>
  )
}
