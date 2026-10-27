import { useEffect, useMemo, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ReportHeader } from '@/components/reports/ReportHeader'
import { usePrintReport } from '@/hooks/use-print-report'
import useChancellorStore from '@/stores/useChancellorStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { formatDateBR } from '@/lib/format-utils'
import { A4_REPORT_PRINT_STYLE } from '@/lib/report-print-style'
import {
  buildSessionSpeechRows,
  defaultSpeechDay,
  defaultSpeechMonth,
  EMPTY_SESSION_SPEECH_FILTERS,
  resolveSessionSpeechRange,
  SESSION_SPEECH_CATEGORY_OPTIONS,
  type SessionSpeechCategoryId,
  type SessionSpeechFilters,
  type SessionSpeechPeriod,
} from '@/lib/session-speech-list'

const PERIOD_LABELS: Record<SessionSpeechPeriod, string> = {
  day: 'Dia da sessão',
  month: 'Mês',
  range: 'Intervalo',
}

export function SessionSpeechPanel() {
  const brothers = useChancellorStore((state) => state.brothers)
  const fetchSettings = useSiteSettingsStore((state) => state.fetchSettings)
  const [period, setPeriod] = useState<SessionSpeechPeriod>('day')
  const [day, setDay] = useState(defaultSpeechDay)
  const [month, setMonth] = useState(defaultSpeechMonth)
  const [from, setFrom] = useState(defaultSpeechDay)
  const [to, setTo] = useState(defaultSpeechDay)
  const [filters, setFilters] = useState<SessionSpeechFilters>(EMPTY_SESSION_SPEECH_FILTERS)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  const range = useMemo(
    () => resolveSessionSpeechRange({ period, day, month, from, to }),
    [period, day, month, from, to],
  )

  const rows = useMemo(() => {
    if (!range) return []
    return buildSessionSpeechRows(brothers, filters, range.start, range.end)
  }, [brothers, filters, range])

  const handlePrint = usePrintReport({
    contentRef: sheetRef,
    documentTitle: range ? `Falas_Sessao_${range.start}` : 'Falas_Sessao',
    pageStyle: A4_REPORT_PRINT_STYLE,
    successTitle: 'Lista de falas enviada à impressão',
    successDescription: 'Imprima em A4 para usar na sessão.',
    errorDescription: 'Não foi possível gerar a lista de falas. Tente novamente.',
  })

  function toggleFilter(id: SessionSpeechCategoryId, checked: boolean) {
    setFilters((current) => ({ ...current, [id]: checked }))
  }

  const periodLabel = range
    ? range.start === range.end
      ? formatDateBR(range.start)
      : `${formatDateBR(range.start)} a ${formatDateBR(range.end)}`
    : 'Período inválido'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Falas da sessão</CardTitle>
          <CardDescription>
            Marque só o que vai ser falado. Aniversários, cunha, sobrinhos e datas
            maçônicas aparecem quando o cadastro do irmão tem a data. Datas da
            sociedade não dependem de profissão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="speech-period">Período</Label>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as SessionSpeechPeriod)}
              >
                <SelectTrigger id="speech-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABELS) as SessionSpeechPeriod[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PERIOD_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {period === 'day' ? (
              <div className="space-y-2">
                <Label htmlFor="speech-day">Data</Label>
                <Input
                  id="speech-day"
                  type="date"
                  value={day}
                  onChange={(event) => setDay(event.target.value)}
                />
              </div>
            ) : null}
            {period === 'month' ? (
              <div className="space-y-2">
                <Label htmlFor="speech-month">Mês</Label>
                <Input
                  id="speech-month"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </div>
            ) : null}
            {period === 'range' ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="speech-from">De</Label>
                  <Input
                    id="speech-from"
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speech-to">Até</Label>
                  <Input
                    id="speech-to"
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SESSION_SPEECH_CATEGORY_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={filters[option.id]}
                  onCheckedChange={(value) => toggleFilter(option.id, value === true)}
                />
                {option.label}
              </label>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            {range
              ? `${rows.length} fala${rows.length === 1 ? '' : 's'} em ${periodLabel}.`
              : 'Informe um período válido. No intervalo, a data inicial precisa ser anterior ou igual à final.'}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => handlePrint()} disabled={!range || rows.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir A4
        </Button>
      </div>

      <div className="overflow-auto rounded-md border bg-muted/30 p-3">
        <div
          ref={sheetRef}
          className="mx-auto w-full max-w-[210mm] bg-white p-4 text-black shadow-sm sm:p-8"
        >
          <ReportHeader
            title="Falas da sessão"
            subtitle={periodLabel}
            description="Lista para o Chanceler mencionar em loja."
          />
          {rows.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma fala neste período com os filtros marcados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Data</TableHead>
                  <TableHead className="text-black">Fala</TableHead>
                  <TableHead className="text-black">Nome</TableHead>
                  <TableHead className="text-black">Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">{formatDateBR(row.date)}</TableCell>
                    <TableCell>{row.speech}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.link}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
