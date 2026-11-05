import { useEffect, useRef, useState } from 'react'
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
  SIGNATURE_SHEET_DEGREE_LABELS,
  VISITOR_SIGNATURE_SHEET_PRINT_STYLE,
  visitorSignatureBlankRowCount,
  visitorSignatureSheetDocumentTitle,
} from '@/lib/attendance-signature-sheet'
import { resolvePrintedEventLocation } from '@/lib/event-locations'
import { VisitorSignatureSheetDocument } from './VisitorSignatureSheetDocument'

export function VisitorSignatureSheetDialog({
  open,
  onOpenChange,
  event,
}: VisitorSignatureSheetDialogProps) {
  const { locations } = useChancellorStore()
  const { positions, fetchPositions, initialized } = useLodgePositionsStore()
  const fetchSettings = useSiteSettingsStore((s) => s.fetchSettings)
  const siteTitle = useSiteSettingsStore((s) => s.siteTitle)
  const contact = useSiteSettingsStore((s) => s.contact)
  const templeName = useSiteSettingsStore((s) => s.sessionSchedule.templeName)
  const [sessionDegree, setSessionDegree] = useState<MasonicDegree>('Aprendiz')
  const sheetRef = useRef<HTMLDivElement>(null)
  const blankRowCount = visitorSignatureBlankRowCount()

  useEffect(() => {
    if (open && !initialized) void fetchPositions()
  }, [open, initialized, fetchPositions])

  useEffect(() => {
    if (open) void fetchSettings()
  }, [open, fetchSettings])

  useEffect(() => {
    if (!open) return
    setSessionDegree(event?.degree ?? 'Aprendiz')
  }, [open, event?.id, event?.degree])

  const handlePrint = usePrintReport({
    contentRef: sheetRef,
    documentTitle: event
      ? visitorSignatureSheetDocumentTitle(event.date, sessionDegree)
      : 'Folha_Presenca_Visitantes',
    pageStyle: VISITOR_SIGNATURE_SHEET_PRINT_STYLE,
    successTitle: 'Folha de visitantes enviada à impressão',
    successDescription:
      'Folha em branco para assinatura de visitantes. Imprima em A4, em folhas separadas da lista da loja.',
    errorDescription:
      'Não foi possível gerar a folha de visitantes. Tente novamente.',
  })

  if (!event) return null

  const locationName = resolvePrintedEventLocation(
    event,
    locations,
    siteTitle,
    contact,
    templeName,
  )
  const venerableMaster =
    positions.find((p) => p.position_type === 'veneravel_mestre')?.user?.full_name ||
    'Venerável Mestre'
  const chancellor =
    positions.find((p) => p.position_type === 'chanceler')?.user?.full_name || 'Chanceler'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Folha de presença — Visitantes</DialogTitle>
          <DialogDescription>
            Sessão, data, horário, grau e local saem em branco para preencher à
            mão. Na impressão, desmarque “Imprimir cabeçalhos e rodapés” para não
            sair número da folha nem data do navegador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="visitor-signature-sheet-degree">Grau da sessão</Label>
          <Select
            value={sessionDegree}
            onValueChange={(value) => setSessionDegree(value as MasonicDegree)}
          >
            <SelectTrigger id="visitor-signature-sheet-degree" className="max-w-md">
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
            {blankRowCount} linhas em branco cabem nesta A4, após o cabeçalho.
          </p>
        </div>

        <div className="flex-1 overflow-auto rounded-md border bg-muted/30 p-3">
          <div
            ref={sheetRef}
            id="visitor-signature-sheet-container"
            className="mx-auto w-full max-w-[210mm] bg-white p-4 shadow-sm sm:p-8"
          >
            <VisitorSignatureSheetDocument
              eventTitle={event.title}
              eventDate={event.date}
              eventTime={event.time}
              locationName={locationName}
              sessionDegree={sessionDegree}
              venerableMaster={venerableMaster}
              chancellor={chancellor}
              blankRowCount={blankRowCount}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => handlePrint()} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir A4
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface VisitorSignatureSheetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
}
