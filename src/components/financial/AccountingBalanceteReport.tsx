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
  buildAccountingBalancete,
  buildAccountingBalanceteAllPeriods,
  filterTransactionsForBalancetePeriod,
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
    () => filterTransactionsForBalancetePeriod(transactions, dateRange, accountFilter),
    [transactions, dateRange, accountFilter],
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
      )
    }

    return buildAccountingBalanceteAllPeriods(
      accounts,
      transactions,
      attachmentsByTransactionId,
      accountFilter,
    )
  }, [accounts, transactions, attachmentsByTransactionId, dateRange, accountFilter])

  const accountFilterLabel =
    accountFilter === 'all'
      ? undefined
      : accounts.find((account) => account.id === accountFilter)?.name

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Balancete_Contabil_${period}`,
    pageStyle: `
      @page { size: A4; margin: 12mm 15mm; }
      @media print {
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
  const hasData = balancete.periodTransactionCount > 0 || accounts.length > 0

  const handleExportZip = async () => {
    setExportingZip(true)
    try {
      await exportBalanceteZip({
        balancete,
        periodLabel,
        accountFilterLabel,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between no-print">
        <div>
          <h3 className="text-lg font-medium">Balancete Contábil</h3>
          <p className="text-sm text-muted-foreground">
            Relatório completo para contabilidade com saldos por conta, razão analítico,
            observações e comprovantes anexados. Exporte um ZIP com planilhas e arquivos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(value) => onPeriodChange(value as FinancialReportPeriodKey)}>
            <SelectTrigger className="w-[180px]">
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
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[200px]">
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

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-base">Pré-visualização</CardTitle>
          <CardDescription>{periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {isBusy ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando balancete...
            </div>
          ) : !hasData ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum lançamento encontrado para o período selecionado.
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-auto rounded-md border p-4">
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

      <div
        id="financial-balancete-container"
        className="hidden print:block"
        ref={printRef}
      >
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
