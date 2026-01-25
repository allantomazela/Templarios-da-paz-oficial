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
import { Download, FileText } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { VisitorCertificateDocument } from './VisitorCertificateDocument'
import type { VisitorAttendance } from '@/lib/data'
import {
  DEGREE_OPTIONS,
  OBEDIENCE_OPTIONS,
  normalizeVisitorAttendanceInput,
  validateVisitorAttendanceInput,
} from '@/lib/visitor-attendance'

export function VisitorCertificate() {
  const { events, sessionRecords } = useChancellorStore()
  const { positions, fetchPositions } = useLodgePositionsStore()
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

  // Buscar cargos ao montar o componente
  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  // Obter nomes do Venerável Mestre e Chanceler
  const venerableMaster = positions.find(
    (p) => p.position_type === 'veneravel_mestre'
  )?.user?.full_name || 'Venerável Mestre'

  const chancellor = positions.find(
    (p) => p.position_type === 'chanceler'
  )?.user?.full_name || 'Chanceler'

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const selectedSession = selectedEvent
    ? sessionRecords.find((sr) => sr.eventId === selectedEvent.id)
    : null

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `Certificado_Presenca_${visitorInfo.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onAfterPrint: () => {
      toast({
        title: 'Certificado Gerado',
        description: 'O certificado foi enviado para impressão/PDF. Use "Salvar como PDF" na janela de impressão para salvar o arquivo.',
      })
    },
    onPrintError: (error) => {
      toast({
        title: 'Erro ao Gerar PDF',
        description: 'Não foi possível gerar o PDF. Tente novamente.',
        variant: 'destructive',
      })
      console.error('Erro ao imprimir:', error)
    },
  })

  const normalizedVisitor = normalizeVisitorAttendanceInput(visitorInfo)
  const validationErrors = validateVisitorAttendanceInput(normalizedVisitor)
  const canGenerate = Boolean(selectedEventId) && validationErrors.length === 0

  const certificateVisitor: VisitorAttendance = {
    ...normalizedVisitor,
    sessionRecordId: selectedSession?.id || 'manual',
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
            Gere certificados de presença para irmãos visitantes de outras lojas que participaram das sessões.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário de Dados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event">Evento/Sessão *</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger id="event">
                  <SelectValue placeholder="Selecione o evento" />
                </SelectTrigger>
                <SelectContent>
                  {events
                    .filter((e) => {
                      const record = sessionRecords.find((sr) => sr.eventId === e.id)
                      return record && record.status === 'Finalizada'
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })} - {event.title}
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
              <Input
                id="lodge"
                placeholder="Nome da loja"
                value={visitorInfo.lodge}
                onChange={(e) =>
                  setVisitorInfo((prev) => ({ ...prev, lodge: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lodgeNumber">Número da Loja *</Label>
              <Input
                id="lodgeNumber"
                placeholder="Ex: 123"
                value={visitorInfo.lodgeNumber}
                onChange={(e) =>
                  setVisitorInfo((prev) => ({ ...prev, lodgeNumber: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="masonicNumber">Número de Registro Maçônico (Opcional)</Label>
              <Input
                id="masonicNumber"
                placeholder="Número de registro maçônico"
                value={visitorInfo.masonicNumber}
                onChange={(e) =>
                  setVisitorInfo((prev) => ({ ...prev, masonicNumber: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={handlePrint}
              disabled={!canGenerate}
              className="gap-2"
              title="Imprimir ou salvar como PDF"
            >
              <Download className="h-4 w-4" />
              Gerar Certificado / Salvar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificado formatado para impressão/PDF */}
      {canGenerate && selectedEvent && (
        <div
          id="visitor-certificate-container"
          className="hidden print:block"
          ref={certificateRef}
        >
          <VisitorCertificateDocument
            visitor={certificateVisitor}
            event={selectedEvent}
            venerableMaster={venerableMaster}
            chancellor={chancellor}
          />
        </div>
      )}
    </div>
  )
}
