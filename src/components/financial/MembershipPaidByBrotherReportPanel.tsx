import { useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { BrotherSearchCombobox } from '@/components/financial/BrotherSearchCombobox'
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
import { buildMembershipPaidByBrotherReportData } from '@/lib/membership-open-paid-report'
import {
  exportMembershipPaidByBrotherCsv,
  exportMembershipPaidByBrotherDetailCsv,
} from '@/lib/membership-report-export'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import { MembershipPaidByBrotherReportDocument } from '@/components/financial/MembershipPaidByBrotherReportDocument'

const PRINT_STYLE = `
  @page { size: A4; margin: 12mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`

interface MembershipPaidByBrotherReportPanelProps {
  schedules: BrotherMembershipSchedule[]
  brothers: { id: string; full_name: string | null }[]
}

export function MembershipPaidByBrotherReportPanel({
  schedules,
  brothers,
}: MembershipPaidByBrotherReportPanelProps) {
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  const [selectedBrotherId, setSelectedBrotherId] = useState('')

  const report = useMemo(
    () =>
      buildMembershipPaidByBrotherReportData(
        schedules,
        selectedBrotherId || null,
      ),
    [schedules, selectedBrotherId],
  )

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Mensalidades Pagas por Irmão',
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
            <CardTitle className="text-sm font-medium">Irmãos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.summary.brotherCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Meses pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.summary.paidMonthCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrencyBRL(report.summary.totalPaidAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Mensalidades pagas por irmão</CardTitle>
          <CardDescription>
            Filtre um irmão ou deixe em branco para ver todos com pagamentos
            registrados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <BrotherSearchCombobox
              brothers={brothers}
              value={selectedBrotherId}
              onChange={setSelectedBrotherId}
              placeholder="Todos os irmãos"
              className="sm:flex-1"
            />
            {selectedBrotherId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedBrotherId('')}
              >
                Limpar filtro
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled={report.summary.brotherCount === 0}
              onClick={() => {
                exportMembershipPaidByBrotherCsv(report)
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
                exportMembershipPaidByBrotherDetailCsv(report)
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
              Nenhum pagamento encontrado para o filtro atual.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Meses pagos</TableHead>
                    <TableHead>Períodos</TableHead>
                    <TableHead className="text-right">Total pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row) => (
                    <TableRow key={row.brotherId}>
                      <TableCell className="font-medium">{row.brotherName}</TableCell>
                      <TableCell>{row.paidMonthCount}</TableCell>
                      <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                        {row.periodsLabel}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-700">
                        {formatCurrencyBRL(row.totalPaidAmount)}
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
            Documento usado na impressão / PDF das mensalidades pagas por irmão.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
            <div ref={printRef}>
              <MembershipPaidByBrotherReportDocument data={report} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
