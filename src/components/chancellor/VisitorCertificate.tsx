import { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
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
import { Download, FileText, MessageCircle, Share2 } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  formatCalendarDate,
  formatDateBR,
  getCalendarDateTimestamp,
} from '@/lib/format-utils'
import { useToast } from '@/hooks/use-toast'
import {
  VisitorCertificateDocument,
  VISITOR_CERTIFICATE_PAGE_STYLE,
} from './VisitorCertificateDocument'
import type { VisitorAttendance } from '@/lib/data'
import {
  DEGREE_OPTIONS,
  LODGE_NAME_PREFIX,
  OBEDIENCE_OPTIONS,
  buildVisitorCertificateShareText,
  normalizeVisitorAttendanceInput,
  openVisitorCertificateWhatsApp,
  stripLodgeNamePrefix,
  validateVisitorAttendanceInput,
} from '@/lib/visitor-attendance'

const CERTIFICATE_PRINT_PAGE_STYLE = VISITOR_CERTIFICATE_PAGE_STYLE

export function VisitorCertificate() {
  const { events, sessionRecords } = useChancellorStore()
  const { positions, fetchPositions, initialized } = useLodgePositionsStore()
  const siteTitle = useSiteSettingsStore((s) => s.siteTitle)
  const { toast } = useToast()
  const certificateRef = useRef<HTMLDivElement>(null)

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

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `Certificado_Presenca_${visitorInfo.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: CERTIFICATE_PRINT_PAGE_STYLE,
    onAfterPrint: () => {
      toast({
        title: 'Certificado enviado à impressão',
        description:
          'Cada certificado ocupa metade da folha A4 — você pode imprimir dois por página.',
      })
    },
    onPrintError: (error) => {
      toast({
        title: 'Erro ao gerar impressão',
        description: 'Não foi possível imprimir o certificado. Tente novamente.',
        variant: 'destructive',
      })
      console.error('Erro ao imprimir certificado:', error)
    },
  })

  const normalizedVisitor = normalizeVisitorAttendanceInput(visitorInfo)
  const validationErrors = validateVisitorAttendanceInput(normalizedVisitor)
  const canGenerate = Boolean(selectedEventId) && validationErrors.length === 0

  const certificateVisitor: VisitorAttendance = {
    ...normalizedVisitor,
    id: 'preview',
    sessionRecordId: selectedSession?.id || 'manual',
  }

  const shareText = selectedEvent
    ? buildVisitorCertificateShareText({
        visitor: normalizedVisitor,
        eventTitle: selectedEvent.title,
        eventDateLabel: formatCalendarDate(
          selectedEvent.date,
          "dd 'de' MMMM 'de' yyyy",
          { locale: ptBR },
        ),
        lodgeTitle: siteTitle || 'Templários da Paz',
        venerableMaster,
        chancellor,
      })
    : ''

  const handleShareWhatsApp = () => {
    if (!canGenerate || !shareText) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios antes de compartilhar.',
        variant: 'destructive',
      })
      return
    }

    const plainText = shareText.replace(/\*/g, '')
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (isMobile && typeof navigator.share === 'function') {
      void navigator.share({
        title: 'Certificado de Presença — Visitante',
        text: plainText,
      }).catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return
        openVisitorCertificateWhatsApp(shareText)
      })
      return
    }

    openVisitorCertificateWhatsApp(shareText)
    toast({
      title: 'WhatsApp',
      description: 'O texto do certificado foi aberto para compartilhamento.',
    })
  }

  const triggerPrint = () => {
    if (!canGenerate || !selectedEvent) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios antes de imprimir.',
        variant: 'destructive',
      })
      return
    }

    window.setTimeout(() => {
      void handlePrint()
    }, 0)
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
            Gere certificados em meia folha A4 (dois por página na impressão), com
            modelo maçônico e compartilhamento por WhatsApp.
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
              onClick={handleShareWhatsApp}
              disabled={!canGenerate}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Compartilhar no WhatsApp
            </Button>
            <Button
              type="button"
              onClick={triggerPrint}
              disabled={!canGenerate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {canGenerate && selectedEvent && (
        <>
          <div
            ref={certificateRef}
            aria-hidden
            className="pointer-events-none fixed left-[-10000px] top-0 w-[210mm] opacity-0"
          >
            <VisitorCertificateDocument
              visitor={certificateVisitor}
              event={selectedEvent}
              venerableMaster={venerableMaster}
              chancellor={chancellor}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Share2 className="h-4 w-4" />
                Pré-visualização (meia folha A4)
              </CardTitle>
              <CardDescription>
                Formato compacto para caber dois certificados por folha na impressão.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto rounded-lg border bg-neutral-200/60 p-4 dark:bg-neutral-900/40">
              <div
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
        </>
      )}
    </div>
  )
}
