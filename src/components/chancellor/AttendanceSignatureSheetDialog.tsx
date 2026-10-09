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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Event } from '@/lib/data'
import useChancellorStore from '@/stores/useChancellorStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { usePrintReport } from '@/hooks/use-print-report'
import { MASONIC_DEGREE_OPTIONS, type MasonicDegree } from '@/lib/masonic-degree'
import {
  buildSignatureSheetRows,
  SIGNATURE_SHEET_DEGREE_LABELS,
  SIGNATURE_SHEET_PRINT_STYLE,
  signatureSheetDocumentTitle,
  signatureSheetLocationName,
} from '@/lib/attendance-signature-sheet'
import { AttendanceSignatureSheetDocument } from './AttendanceSignatureSheetDocument'

export function AttendanceSignatureSheetDialog({
  open,
  onOpenChange,
  event,
}: AttendanceSignatureSheetDialogProps) {
  const { brothers, locations } = useChancellorStore()
  const { positions, fetchPositions, initialized } = useLodgePositionsStore()
  const fetchSettings = useSiteSettingsStore((s) => s.fetchSettings)
  const siteTitle = useSiteSettingsStore((s) => s.siteTitle)
  const contact = useSiteSettingsStore((s) => s.contact)
  const [sessionDegree, setSessionDegree] = useState<MasonicDegree>('Aprendiz')
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && !initialized) void fetchPositions()
  }, [open, initialized, fetchPositions])

  useEffect(() => {
    if (open) void fetchSettings()
  }, [open, fetchSettings])

  useEffect(() => {
    if (open) setSessionDegree(event?.degree ?? 'Aprendiz')
  }, [open, event?.id, event?.degree])

  const rows = useMemo(
    () => buildSignatureSheetRows(brothers, sessionDegree),
    [brothers, sessionDegree],
  )

  const handlePrint = usePrintReport({
    contentRef: sheetRef,
    documentTitle: event
      ? signatureSheetDocumentTitle(event.date, sessionDegree)
      : 'Folha_Presenca',
    pageStyle: SIGNATURE_SHEET_PRINT_STYLE,
    successTitle: 'Folha de presença enviada à impressão',
    successDescription: 'Imprima em papel A4 para colar no livro de presença.',
    errorDescription: 'Não foi possível gerar a folha de presença. Tente novamente.',
  })

  if (!event) return null

  const locationName = signatureSheetLocationName(event, locations, siteTitle, contact)
  const venerableMaster =
    positions.find((p) => p.position_type === 'veneravel_mestre')?.user?.full_name ||
    'Venerável Mestre'
  const chancellor =
    positions.find((p) => p.position_type === 'chanceler')?.user?.full_name || 'Chanceler'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Folha de presença para o livro</DialogTitle>
          <DialogDescription>
            Lista apenas os irmãos ativos e regulares do quadro. Escolha o grau da sessão
            antes de imprimir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="signature-sheet-degree">Grau da sessão</Label>
          <Select
            value={sessionDegree}
            onValueChange={(value) => setSessionDegree(value as MasonicDegree)}
          >
            <SelectTrigger id="signature-sheet-degree" className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MASONIC_DEGREE_OPTIONS.map((degree) => (
                <SelectItem key={degree} value={degree}>
                  {SIGNATURE_SHEET_DEGREE_LABELS[degree]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {rows.length} irmão{rows.length !== 1 ? 's' : ''} na folha.
          </p>
        </div>

        <div className="flex-1 overflow-auto rounded-md border bg-muted/30 p-3">
          <div
            ref={sheetRef}
            id="attendance-signature-sheet-container"
            className="mx-auto w-full max-w-[210mm] bg-white p-4 shadow-sm sm:p-8"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => handlePrint()} disabled={rows.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir A4
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AttendanceSignatureSheetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
}
