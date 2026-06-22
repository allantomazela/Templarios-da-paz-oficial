import { useState, useRef, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, FileText, Loader2, MessageCircle, Share2 } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { format } from 'date-fns'
import {
  formatDateBR,
  getCalendarDateTimestamp,
} from '@/lib/format-utils'
import { useToast } from '@/hooks/use-toast'
import { VisitorCertificateDocument } from './VisitorCertificateDocument'
import type { VisitorAttendance } from '@/lib/data'
import {
  DEGREE_OPTIONS,
  LODGE_NAME_PREFIX,
  OBEDIENCE_OPTIONS,
  normalizeVisitorAttendanceInput,
  stripLodgeNamePrefix,
  validateVisitorAttendanceInput,
} from '@/lib/visitor-attendance'
import {
  buildVisitorCertificateFileBaseName,
  exportVisitorCertificateAssets,
  getVisitorCertificateCaptureElement,
  openVisitorCertificatePrintWindow,
  shareVisitorCertificateFiles,
} from '@/lib/visitor-certificate-export'

export function VisitorCertificate() {
  const { events, sessionRecords } = useChancellorStore()
  const { positions, fetchPositions, initialized } = useLodgePositionsStore()
  const siteTitle = useSiteSettingsStore((s) => s.siteTitle)
  const { toast } = useToast()
  const certificateRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [visitorInfo, setVisitorInfo] = useState<VisitorAttendance>({
    id: 'preview',
    sessionRecordId: 'manual',
    name: '',
    degree: 'Mestre',
    lodge: '',
    lodgeNumber: '',
    obedience: 'GOB',
    masonicNumber: '',
  })

  useEffect(() => {
    if (!initialized) void fetchPositions()
  }, [initialized, fetchPositions])

  const venerableMaster =
    positions.find((p) => p.position_type === 'veneravel_mestre')?.user
      ?.full_name || 'Venerável Mestre'

  const chancellor =
    positions.find((p) => p.position_type === 'chanceler')?.user?.full_name ||
    'Chanceler'

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const selectedSession = selectedEvent
    ? sessionRecords.find((sr) => sr.eventId === selectedEvent.id)
    : null

  const normalizedVisitor = normalizeVisitorAttendanceInput(visitorInfo)
  const validationErrors = validateVisitorAttendanceInput(normalizedVisitor)
  const canGenerate = Boolean(selectedEventId) && validationErrors.length === 0

  const certificateVisitor: VisitorAttendance = {
    ...normalizedVisitor,
    id: 'preview',
    sessionRecordId: selectedSession?.id || 'manual',
  }

  const fileBaseName = buildVisitorCertificateFileBaseName(normalizedVisitor.name)
  const shareTitle = `Certificado de Presença — ${normalizedVisitor.name}`
  const lodgeTitle = siteTitle || 'Templários da Paz'

  const getCaptureElement = () =>
    getVisitorCertificateCaptureElement(certificateRef.current)

  const runExport = async () => {
    const element = getCaptureElement()
    if (!element) {
      throw new Error('Pré-visualização do certificado não encontrada.')
    }
    return exportVisitorCertificateAssets(element)
  }

  const handleShare = async () => {
    if (!canGenerate || !selectedEvent) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios antes de compartilhar.',
        variant: 'destructive',
      })
      return
    }

    setIsExporting(true)
    try {
      const assets = await runExport()
      const mode = await shareVisitorCertificateFiles({
        jpegBlob: assets.jpegBlob,
        pdfBlob: assets.pdfBlob,
        baseName: fileBaseName,
        title: shareTitle,
        visitorName: normalizedVisitor.name,
        lodgeTitle,
      })

      if (mode === 'native-shared') {
        toast({
          title: 'Certificado compartilhado',
          description:
            'Escolha o WhatsApp (ou outro app) na lista de compartilhamento.',
        })
      } else if (mode === 'whatsapp-with-downloads') {
        toast({
          title: 'WhatsApp aberto',
          description:
            'PDF e JPEG foram baixados. Anexe os arquivos na conversa do WhatsApp.',
        })
      }
    } catch (error) {
      console.error('Erro ao compartilhar certificado:', error)
      toast({
        title: 'Erro ao compartilhar',
        description: 'Não foi possível gerar PDF e JPEG. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = async () => {
    if (!canGenerate || !selectedEvent) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios antes de imprimir.',
        variant: 'destructive',
      })
      return
    }

    setIsExporting(true)
    try {
      const assets = await runExport()
      const opened = openVisitorCertificatePrintWindow(
        assets.jpegDataUrl,
        fileBaseName,
      )
      if (!opened) {
        toast({
          title: 'Pop-up bloqueado',
          description:
            'Permita pop-ups para abrir o visualizador de impressão do certificado.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Visualizador de impressão',
        description:
          'O certificado foi aberto em nova janela. Use "Salvar como PDF" se desejar.',
      })
    } catch (error) {
      console.error('Erro ao imprimir certificado:', error)
      toast({
        title: 'Erro ao imprimir',
        description: 'Não foi possível gerar o certificado para impressão.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificado de Presença para Visitantes
          </CardTitle>
          <CardDescription>
            Gere certificados em meia folha A4, imprima com visualização fiel ao
            modelo e compartilhe no WhatsApp em PDF e JPEG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event">Evento/Sessão *</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger id="event">
                  <SelectValue placeholder="Selecione o evento" />
                </SelectTrigger>
                <SelectContent>
                  {events
                    .filter((e) => {
                      const record = sessionRecords.find(
                        (sr) => sr.eventId === e.id,
                      )
                      return record && record.status === 'Finalizada'
                    })
                    .sort(
                      (a, b) =>
                        getCalendarDateTimestamp(b.date) -
                        getCalendarDateTimestamp(a.date),
                    )
                    .map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {formatDateBR(event.date)} - {event.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo do Visitante *</Label>
              <Input
                id="name"
                placeholder="Nome completo do irmão visitante"
                value={visitorInfo.name}
                onChange={(e) =>
                  setVisitorInfo((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="degree">Grau *</Label>
              <Select
                value={visitorInfo.degree}
                onValueChange={(value) =>
                  setVisitorInfo((prev) => ({ ...prev, degree: value }))
                }
              >
                <SelectTrigger id="degree">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEGREE_OPTIONS.map((degree) => (
                    <SelectItem key={degree} value={degree}>
                      {degree}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obedience">Obediência *</Label>
              <Select
                value={visitorInfo.obedience}
                onValueChange={(value) =>
                  setVisitorInfo((prev) => ({ ...prev, obedience: value }))
                }
              >
                <SelectTrigger id="obedience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBEDIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lodge">Nome da Loja de Origem *</Label>
              <div className="flex">
                <span
                  className="inline-flex shrink-0 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-xs font-medium text-muted-foreground"
                  aria-hidden
                >
                  {LODGE_NAME_PREFIX.trim()}
                </span>
                <Input
                  id="lodge"
                  className="rounded-l-none"
                  placeholder="Ex: Templários da Paz"
                  value={visitorInfo.lodge}
                  onChange={(e) =>
                    setVisitorInfo((prev) => ({
                      ...prev,
                      lodge: stripLodgeNamePrefix(e.target.value),
                    }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O prefixo maçônico A∴ R∴ L∴ S∴ é incluído automaticamente no
                certificado.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lodgeNumber">Número da Loja *</Label>
              <Input
                id="lodgeNumber"
                placeholder="Ex: 123"
                value={visitorInfo.lodgeNumber}
                onChange={(e) =>
                  setVisitorInfo((prev) => ({
                    ...prev,
                    lodgeNumber: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="masonicNumber">
                Número de Registro Maçônico (Opcional)
              </Label>
              <Input
                id="masonicNumber"
                placeholder="Número de registro maçônico"
                value={visitorInfo.masonicNumber}
                onChange={(e) =>
                  setVisitorInfo((prev) => ({
                    ...prev,
                    masonicNumber: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleShare()}
              disabled={!canGenerate || isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Compartilhar no WhatsApp
            </Button>
            <Button
              type="button"
              onClick={() => void handlePrint()}
              disabled={!canGenerate || isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Imprimir / Salvar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {canGenerate && selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4" />
              Pré-visualização (meia folha A4)
            </CardTitle>
            <CardDescription>
              O que você vê aqui é o mesmo conteúdo enviado à impressão e aos
              arquivos PDF/JPEG.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto rounded-lg border bg-neutral-200/60 p-4 dark:bg-neutral-900/40">
            <div
              ref={certificateRef}
              id="visitor-certificate-container"
              className="visitor-certificate-print-sheet mx-auto shadow-lg"
              style={{ width: '210mm' }}
            >
              <VisitorCertificateDocument
                visitor={certificateVisitor}
                event={selectedEvent}
                venerableMaster={venerableMaster}
                chancellor={chancellor}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
