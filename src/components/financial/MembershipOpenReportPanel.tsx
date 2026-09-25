import { useMemo, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { buildMembershipOpenReportData } from '@/lib/membership-open-paid-report'
import {
  exportMembershipOpenDetailCsv,
  exportMembershipOpenReportCsv,
} from '@/lib/membership-report-export'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import { MembershipOpenReportDocument } from '@/components/financial/MembershipOpenReportDocument'

const PRINT_STYLE = `
  @page { size: A4; margin: 12mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`

interface MembershipOpenReportPanelProps {
  schedules: BrotherMembershipSchedule[]
}

export function MembershipOpenReportPanel({
  schedules,
}: MembershipOpenReportPanelProps) {
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  const report = useMemo(
    () => buildMembershipOpenReportData(schedules),
    [schedules],
  )

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Mensalidades em Aberto',
    pageStyle: PRINT_STYLE,
    onAfterPrint: () => {
      toast({ title: 'Relatório enviado à impressão' })
    },
  })

  return (
    <div className="space-y-4">
      <div className="no-print grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Irmãos em aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.summary.brotherCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Meses em aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.summary.openMonthCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrencyBRL(report.summary.totalOpenAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Mensalidades em aberto</CardTitle>
          <CardDescription>
            Inclui atrasos e pendências ainda não quitadas. Use para cobrança e
            conferência da tesouraria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled={report.summary.brotherCount === 0}
              onClick={() => {
                exportMembershipOpenReportCsv(report)
                toast({ title: 'CSV exportado' })
              }}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV resumo
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={report.summary.brotherCount === 0}
              onClick={() => {
                exportMembershipOpenDetailCsv(report)
                toast({ title: 'CSV detalhado exportado' })
              }}
            >
              <Download className="h-4 w-4" />
              CSV detalhado
            </Button>
            <Button
              className="gap-2"
              disabled={report.summary.brotherCount === 0}
              onClick={() => handlePrint()}
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </div>

          {report.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensalidade em aberto no momento.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Meses</TableHead>
                    <TableHead>Períodos</TableHead>
                    <TableHead className="text-right">Em aberto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row) => (
                    <TableRow key={row.brotherId}>
                      <TableCell className="font-medium">{row.brotherName}</TableCell>
                      <TableCell>{row.openMonthCount}</TableCell>
                      <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                        {row.periodsLabel}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatCurrencyBRL(row.totalOpenAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="no-print">
          <CardTitle className="text-base">Pré-visualização</CardTitle>
          <CardDescription>
            Documento usado na impressão / PDF das mensalidades em aberto.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
            <div ref={printRef}>
              <MembershipOpenReportDocument data={report} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
