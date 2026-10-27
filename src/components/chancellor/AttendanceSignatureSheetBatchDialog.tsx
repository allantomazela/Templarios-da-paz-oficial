import { useEffect, useMemo, useRef, useState } from 'react'
import { Printer } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import useChancellorStore from '@/stores/useChancellorStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { usePrintReport } from '@/hooks/use-print-report'
import { formatDateBR, todayLocalISODate } from '@/lib/format-utils'
import { resolvePrintedEventLocation } from '@/lib/event-locations'
import {
  buildSignatureSheetRows,
  SIGNATURE_SHEET_ORDER_LABELS,
  type SignatureSheetOrder,
} from '@/lib/attendance-signature-sheet'
import {
  filterEventsForSignatureSheetBatch,
  SIGNATURE_SHEET_BATCH_PRINT_STYLE,
  type SignatureSheetBatchPeriod,
} from '@/lib/attendance-signature-sheet-batch'
import { normalizeMasonicDegree } from '@/lib/masonic-degree'
import { AttendanceSignatureSheetDocument } from './AttendanceSignatureSheetDocument'

const PERIOD_LABELS: Record<SignatureSheetBatchPeriod, string> = {
  current_month: 'Mês atual',
  next_4: 'Próximas 4 sessões',
  custom: 'Intervalo de datas',
}

export function AttendanceSignatureSheetBatchDialog({
  open,
  onOpenChange,
}: AttendanceSignatureSheetBatchDialogProps) {
  const { events, brothers, locations } = useChancellorStore()
  const { positions, fetchPositions, initialized } = useLodgePositionsStore()
  const fetchSettings = useSiteSettingsStore((s) => s.fetchSettings)
  const siteTitle = useSiteSettingsStore((s) => s.siteTitle)
  const contact = useSiteSettingsStore((s) => s.contact)
  const templeName = useSiteSettingsStore((s) => s.sessionSchedule.templeName)

  const [period, setPeriod] = useState<SignatureSheetBatchPeriod>('current_month')
  const [fromDate, setFromDate] = useState(todayLocalISODate())
  const [toDate, setToDate] = useState(todayLocalISODate())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sheetOrder, setSheetOrder] = useState<SignatureSheetOrder>('name')
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && !initialized) void fetchPositions()
  }, [open, initialized, fetchPositions])

  useEffect(() => {
    if (open) void fetchSettings()
  }, [open, fetchSettings])

  useEffect(() => {
    if (!open) return
    setPeriod('current_month')
    setSheetOrder('name')
    const today = todayLocalISODate()
    setFromDate(today)
    setToDate(today)
  }, [open])

  const candidates = useMemo(
    () =>
      filterEventsForSignatureSheetBatch(events, {
        period,
        fromDate,
        toDate,
      }),
    [events, period, fromDate, toDate],
  )

  useEffect(() => {
    if (!open) return
    setSelectedIds(candidates.map((event) => event.id))
  }, [open, candidates])

  const selectedEvents = useMemo(() => {
    const selected = new Set(selectedIds)
    return candidates.filter((event) => selected.has(event.id))
  }, [candidates, selectedIds])

  const sheets = useMemo(() => {
    return selectedEvents.map((event) => {
      const sessionDegree = normalizeMasonicDegree(event.degree) ?? 'Aprendiz'
      return {
        event,
        sessionDegree,
        locationName: resolvePrintedEventLocation(
          event,
          locations,
          siteTitle,
          contact,
          templeName,
        ),
        rows: buildSignatureSheetRows(brothers, sessionDegree, sheetOrder),
      }
    })
  }, [selectedEvents, brothers, locations, siteTitle, contact, templeName, sheetOrder])

  const handlePrint = usePrintReport({
    contentRef: sheetRef,
    documentTitle: `Folhas_Presenca_${selectedEvents.length}`,
    pageStyle: SIGNATURE_SHEET_BATCH_PRINT_STYLE,
    successTitle: 'Folhas enviadas à impressão',
    successDescription: `${selectedEvents.length} folha(s) A4 — uma página por sessão, na ordem do livro.`,
    errorDescription: 'Não foi possível gerar as folhas em lote. Tente novamente.',
  })

  const venerableMaster =
    positions.find((p) => p.position_type === 'veneravel_mestre')?.user?.full_name ||
    'Venerável Mestre'
  const chancellor =
    positions.find((p) => p.position_type === 'chanceler')?.user?.full_name || 'Chanceler'

  const allSelected =
    candidates.length > 0 && selectedIds.length === candidates.length

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? candidates.map((event) => event.id) : [])
  }

  function toggleOne(eventId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? current.includes(eventId)
          ? current
          : [...current, eventId]
        : current.filter((id) => id !== eventId),
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Imprimir folhas em lote</DialogTitle>
          <DialogDescription>
            Uma página A4 por sessão, na ordem do livro. Cada folha usa o grau cadastrado
            na sessão. A ordem da lista vale para todas as folhas deste lote.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="batch-period">Período</Label>
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as SignatureSheetBatchPeriod)}
            >
              <SelectTrigger id="batch-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABELS) as SignatureSheetBatchPeriod[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {PERIOD_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch-order">Ordem da lista</Label>
            <Select
              value={sheetOrder}
              onValueChange={(value) => setSheetOrder(value as SignatureSheetOrder)}
            >
              <SelectTrigger id="batch-order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SIGNATURE_SHEET_ORDER_LABELS) as SignatureSheetOrder[]).map(
                  (order) => (
                    <SelectItem key={order} value={order}>
                      {SIGNATURE_SHEET_ORDER_LABELS[order]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          {period === 'custom' ? (
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="batch-from">De</Label>
                <Input
                  id="batch-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-to">Até</Label>
                <Input
                  id="batch-to"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </div>
          ) : (
            <p className="self-end text-sm text-muted-foreground sm:col-span-2">
              {candidates.length}{' '}
              {candidates.length === 1 ? 'sessão' : 'sessões'} no período ·{' '}
              {selectedEvents.length} selecionada{selectedEvents.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="max-h-40 space-y-2 overflow-auto rounded-md border p-3">
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sessão neste período. Ajuste o filtro ou cadastre sessões na Agenda.
            </p>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(value) => toggleAll(value === true)}
                />
                Selecionar todas
              </label>
              {candidates.map((event) => (
                <label
                  key={event.id}
                  className="flex items-start gap-2 text-sm leading-snug"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selectedIds.includes(event.id)}
                    onCheckedChange={(value) => toggleOne(event.id, value === true)}
                  />
                  <span>
                    <span className="font-medium">
                      {formatDateBR(event.date)} · {event.time?.slice(0, 5) || '—'}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}
                      — {event.title}
                      {event.degree ? ` · ${event.degree}` : ' · Aprendiz'}
                    </span>
                  </span>
                </label>
              ))}
            </>
          )}
        </div>

        <div className="flex-1 overflow-auto rounded-md border bg-muted/30 p-3">
          <div
            ref={sheetRef}
            id="attendance-signature-sheet-batch-container"
            className="mx-auto w-full max-w-[210mm] space-y-6"
          >
            {sheets.map(({ event, sessionDegree, locationName, rows }) => (
              <div
                key={event.id}
                className="signature-sheet-batch-page bg-white p-4 shadow-sm sm:p-8"
              >
                <AttendanceSignatureSheetDocument
                  eventTitle={event.title}
                  eventDate={event.date}
                  eventTime={event.time}
                  locationName={locationName}
                  sessionDegree={sessionDegree}
                  rows={rows}
                  venerableMaster={venerableMaster}
                  chancellor={chancellor}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            onClick={() => handlePrint()}
            disabled={
              selectedEvents.length === 0 || sheets.every((sheet) => sheet.rows.length === 0)
            }
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir {selectedEvents.length || ''} A4
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AttendanceSignatureSheetBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
