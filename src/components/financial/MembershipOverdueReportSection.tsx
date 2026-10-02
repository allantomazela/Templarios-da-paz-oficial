import { useRef } from 'react'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { formatCurrencyBRL } from '@/lib/format-utils'
import type { MembershipOverdueReportData } from '@/lib/membership-report'
import {
  exportMembershipOverdueDetailCsv,
  exportMembershipOverdueReportCsv,
} from '@/lib/membership-report-export'
import { runCsvExportWithToast } from '@/lib/csv-export-toast'
import { MEMBERSHIP_PRINT_STYLE } from '@/lib/membership-print-style'
import { MembershipOverdueReportDocument } from './MembershipOverdueReportDocument'

function MetricCard({ title, value, valueClassName = '' }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${valueClassName}`.trim()}>{value}</p>
      </CardContent>
    </Card>
  )
}

export function MembershipOverdueReportSection({
  overdueReport,
}: MembershipOverdueReportSectionProps) {
  const { toast } = useToast()
  const overduePrintRef = useRef<HTMLDivElement>(null)
  const { summary } = overdueReport
  const isEmpty = summary.brotherCount === 0

  const handlePrintOverdue = useReactToPrint({
    contentRef: overduePrintRef,
    documentTitle: `Mensalidades_Atraso_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: MEMBERSHIP_PRINT_STYLE,
    onAfterPrint: () => {
      toast({
        title: 'Relatório enviado à impressão',
        description: 'Use "Salvar como PDF" na janela de impressão.',
      })
    },
  })

  return (
    <>
      <div className="no-print grid gap-3 sm:grid-cols-3">
        <MetricCard title="Irmãos em atraso" value={summary.brotherCount} />
        <MetricCard
          title="Valor em aberto"
          value={formatCurrencyBRL(summary.totalOverdueAmount)}
          valueClassName="text-destructive"
        />
        <MetricCard title="Prioridade (3+ meses)" value={summary.escalationCount} />
      </div>

      <div className="no-print flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            runCsvExportWithToast(
              toast,
              () => exportMembershipOverdueReportCsv(overdueReport),
              'Resumo por irmão baixado.',
            )
          }
          disabled={isEmpty}
        >
          <FileSpreadsheet className="h-4 w-4" />
          CSV resumo
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            runCsvExportWithToast(
              toast,
              () => exportMembershipOverdueDetailCsv(overdueReport),
              'Detalhamento por mês baixado.',
            )
          }
          disabled={isEmpty}
        >
          <FileSpreadsheet className="h-4 w-4" />
          CSV detalhado
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => handlePrintOverdue()}
          disabled={isEmpty}
        >
          <Download className="h-4 w-4" />
          Imprimir / PDF
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="no-print">
          <CardTitle className="text-base">Pré-visualização</CardTitle>
          <CardDescription>Relatório de verificação de atrasos</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
            <div id="membership-overdue-report-container" ref={overduePrintRef}>
              <MembershipOverdueReportDocument data={overdueReport} />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  valueClassName?: string
}

interface MembershipOverdueReportSectionProps {
  overdueReport: MembershipOverdueReportData
}
