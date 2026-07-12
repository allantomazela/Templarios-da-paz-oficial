import { useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useReactToPrint } from 'react-to-print'
import { FileSpreadsheet, Printer, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyBRL } from '@/lib/format-utils'
import {
  buildMembershipStatusReportData,
  DEFAULT_MEMBERSHIP_STATUS_REPORT_FILTERS,
  type MembershipSituationFilter,
  type MembershipStatusReportFilters,
} from '@/lib/membership-report'
import { exportMembershipStatusReportCsv } from '@/lib/membership-report-export'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import { MembershipStatusReportDocument } from '@/components/financial/MembershipStatusReportDocument'

const MEMBERSHIP_PRINT_STYLE = `
  @page { size: A4 landscape; margin: 10mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`

interface MembershipStatusReportPanelProps {
  schedules: BrotherMembershipSchedule[]
}

function situationBadgeClass(situation: string): string {
  switch (situation) {
    case 'up_to_date':
      return 'bg-green-600 hover:bg-green-700'
    case 'overdue':
      return ''
    case 'pending':
      return 'bg-amber-500 hover:bg-amber-600'
    default:
      return ''
  }
}

export function MembershipStatusReportPanel({
  schedules,
}: MembershipStatusReportPanelProps) {
  const [filters, setFilters] = useState<MembershipStatusReportFilters>(
    DEFAULT_MEMBERSHIP_STATUS_REPORT_FILTERS,
  )
  const printRef = useRef<HTMLDivElement>(null)

  const report = useMemo(
    () => buildMembershipStatusReportData(schedules, filters),
    [schedules, filters],
  )

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Relatório de Situação das Mensalidades',
    pageStyle: MEMBERSHIP_PRINT_STYLE,
  })

  const generatedLabel = format(new Date(report.summary.generatedAt), "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Relatório de situação</CardTitle>
          <CardDescription>
            Consulte quem está em dia, quem possui pendências e quem está em atraso.
            Filtre, visualize na tela, imprima ou exporte em CSV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Situação</Label>
              <Select
                value={filters.situation}
                onValueChange={(value: MembershipSituationFilter) =>
                  setFilters((current) => ({ ...current, situation: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="up_to_date">Em dia</SelectItem>
                  <SelectItem value="overdue">Em atraso</SelectItem>
                  <SelectItem value="pending">Com pendências à vencer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mínimo de meses em atraso</Label>
              <Select
                value={String(filters.minOverdueMonths)}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    minOverdueMonths: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Qualquer</SelectItem>
                  <SelectItem value="1">1 ou mais</SelectItem>
                  <SelectItem value="2">2 ou mais</SelectItem>
                  <SelectItem value="3">3 ou mais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Buscar irmão</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Nome do irmão..."
                  value={filters.searchTerm}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      searchTerm: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={filters.escalationOnly}
                  onCheckedChange={(checked) =>
                    setFilters((current) => ({
                      ...current,
                      escalationOnly: checked === true,
                    }))
                  }
                />
                Somente prioridade tesouraria (3+ meses)
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => exportMembershipStatusReportCsv(report)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Listados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{report.summary.totalBrothers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">
              {report.summary.upToDateCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {report.summary.overdueCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">
              {formatCurrencyBRL(report.summary.totalOverdueAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prioridade (3+)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{report.summary.escalationCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resultado</CardTitle>
          <CardDescription>Atualizado em {generatedLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {report.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum irmão encontrado com os filtros selecionados.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Meses atraso</TableHead>
                    <TableHead>Períodos em atraso</TableHead>
                    <TableHead className="text-right">Em atraso</TableHead>
                    <TableHead className="text-right">À vencer</TableHead>
                    <TableHead className="text-right">Total pago</TableHead>
                    <TableHead>Último quitado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row) => (
                    <TableRow key={row.brotherId}>
                      <TableCell className="font-medium">{row.brotherName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.situation === 'overdue' ? 'destructive' : 'default'
                          }
                          className={situationBadgeClass(row.situation)}
                        >
                          {row.situationLabel}
                        </Badge>
                        {row.requiresEscalation ? (
                          <Badge variant="outline" className="ml-2 text-amber-700">
                            3+ meses
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.overdueMonthCount}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                        {row.overduePeriodsLabel || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {formatCurrencyBRL(row.totalOverdue)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrencyBRL(row.totalOpen)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-700">
                        {formatCurrencyBRL(row.totalPaid)}
                      </TableCell>
                      <TableCell>{row.lastPaidPeriod ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sr-only">
        <div ref={printRef}>
          <MembershipStatusReportDocument data={report} />
        </div>
      </div>
    </div>
  )
}
