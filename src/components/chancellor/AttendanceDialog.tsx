import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FormHeader } from '@/components/ui/form-header'
import {
  Event,
  SessionRecord,
  Attendance,
  VisitorAttendance,
} from '@/lib/data'
import useChancellorStore from '@/stores/useChancellorStore'
import { format, parseISO } from 'date-fns'
import { Check, X, FileText, Users } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { VisitorCertificateDocument } from './VisitorCertificateDocument'
import { VisitorAttendanceSection } from './VisitorAttendanceSection'

interface AttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  existingSessionRecord: SessionRecord | null
  onSave: () => Promise<void>
}

export function AttendanceDialog({
  open,
  onOpenChange,
  event,
  existingSessionRecord,
  onSave,
}: AttendanceDialogProps) {
  const {
    addSessionRecord,
    updateSessionRecord,
    bulkAddAttendance,
    attendanceRecords,
    brothers,
    bulkAddVisitorAttendance,
    fetchVisitorAttendances,
    saveVisitorAttendances,
  } = useChancellorStore()
  const { positions, fetchPositions } = useLodgePositionsStore()
  const certificateRef = useRef<HTMLDivElement>(null)

  const [observations, setObservations] = useState<string>('')
  const [attendances, setAttendances] = useState<
    {
      brotherId: string
      status: 'Presente' | 'Ausente' | 'Justificado'
      justification: string
    }[]
  >([])
  const [visitorList, setVisitorList] = useState<VisitorAttendance[]>([])
  const [certificateVisitor, setCertificateVisitor] =
    useState<VisitorAttendance | null>(null)

  const venerableMaster =
    positions.find((p) => p.position_type === 'veneravel_mestre')?.user
      ?.full_name || 'Venerável Mestre'
  const chancellor =
    positions.find((p) => p.position_type === 'chanceler')?.user?.full_name ||
    'Chanceler'

  const handlePrintCertificate = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: certificateVisitor
      ? `Certificado_Presenca_${certificateVisitor.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}`
      : 'Certificado_Presenca',
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
  })

  const handleAddVisitor = (visitor: VisitorAttendance) => {
    setVisitorList((prev) => [...prev, visitor])
  }

  const handleRemoveVisitor = (visitorId: string) => {
    setVisitorList((prev) => prev.filter((visitor) => visitor.id !== visitorId))
  }

  const handlePrintVisitor = (visitor: VisitorAttendance) => {
    if (!event) return
    setCertificateVisitor(visitor)
    setTimeout(() => handlePrintCertificate(), 0)
  }

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  useEffect(() => {
    if (open) {
      // Initialize state
      if (existingSessionRecord) {
        setObservations(existingSessionRecord.observations)

        // Load existing attendances
        const existing = attendanceRecords.filter(
          (ar) => ar.sessionRecordId === existingSessionRecord.id,
        )
        setAttendances(
          brothers.map((b) => {
            const found = existing.find((e) => e.brotherId === b.id)
            return {
              brotherId: b.id,
              status: found ? found.status : 'Ausente',
              justification: found ? found.justification || '' : '',
            }
          }),
        )
        void fetchVisitorAttendances(existingSessionRecord.id).then(
          (visitors) => {
            setVisitorList(visitors)
          },
        )
      } else {
        setObservations('')
        setAttendances(
          brothers.map((b) => ({
            brotherId: b.id,
            status: 'Ausente', // Default to absent until checked
            justification: '',
          })),
        )
        setVisitorList([])
      }
    }
  }, [open, existingSessionRecord, attendanceRecords, brothers, fetchVisitorAttendances])

  const handleStatusChange = (
    brotherId: string,
    status: 'Presente' | 'Ausente' | 'Justificado',
  ) => {
    setAttendances((prev) =>
      prev.map((a) => (a.brotherId === brotherId ? { ...a, status } : a)),
    )
  }

  const handleJustificationChange = (brotherId: string, text: string) => {
    setAttendances((prev) =>
      prev.map((a) =>
        a.brotherId === brotherId ? { ...a, justification: text } : a,
      ),
    )
  }

  const handleSaveInternal = async () => {
    if (!event) return

    const recordId = existingSessionRecord
      ? existingSessionRecord.id
      : crypto.randomUUID()

    const sessionRecord: SessionRecord = {
      id: recordId,
      eventId: event.id,
      date: event.date,
      charityCollection: 0, // Mantido para compatibilidade, mas não será mais editado aqui
      observations: observations,
      status: 'Finalizada',
    }

    if (existingSessionRecord) {
      updateSessionRecord(sessionRecord)
    } else {
      addSessionRecord(sessionRecord)
    }

    // Save Attendances
    const newAttendances: Attendance[] = attendances.map((a) => ({
      id: crypto.randomUUID(), // In real app, reuse ID if updating
      sessionRecordId: recordId,
      brotherId: a.brotherId,
      status: a.status,
      justification: a.justification,
    }))
    bulkAddAttendance(newAttendances)

    const newVisitorAttendances: VisitorAttendance[] = visitorList.map(
      (visitor) => ({
        ...visitor,
        sessionRecordId: recordId,
      }),
    )
    bulkAddVisitorAttendance(newVisitorAttendances)
    await saveVisitorAttendances(recordId, newVisitorAttendances)

    await onSave()
    onOpenChange(false)
  }

  const presentCount = attendances.filter((a) => a.status === 'Presente').length
  const visitorCount = visitorList.length
  const totalBrothers = brothers.length || 1
  const percentage = Math.round((presentCount / totalBrothers) * 100)
  const totalParticipants = presentCount + visitorCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <FormHeader
          title="Registro de Presença"
          description="Registre a presença dos irmãos neste evento. O tronco de beneficência deve ser registrado no módulo Financeiro."
          icon={<Users className="h-5 w-5" />}
        />

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <Label>Evento</Label>
              <div className="text-sm font-medium">{event?.title}</div>
              <div className="text-xs text-muted-foreground">
                {event?.date ? format(parseISO(event.date), 'dd/MM/yyyy') : ''}
              </div>
            </div>
            <div className="flex flex-col justify-center items-center bg-secondary/20 rounded-md py-3 gap-1">
              <span className="text-xs text-muted-foreground">
                Presença Atual
              </span>
              <span className="text-2xl font-bold text-primary">
                {percentage}%
              </span>
              <span className="text-xs text-muted-foreground">
                Participantes: {totalParticipants}
              </span>
              <span className="text-xs text-muted-foreground">
                Visitantes: {visitorCount}
              </span>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Lista de Presença</Label>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Justificativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendances.map((att) => {
                    const brother = brothers.find(
                      (b) => b.id === att.brotherId,
                    )
                    return (
                      <TableRow key={att.brotherId}>
                        <TableCell>
                          <div className="font-medium">{brother?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {brother?.degree}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              type="button"
                              variant={att.status === 'Presente' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() =>
                                handleStatusChange(att.brotherId, 'Presente')
                              }
                              className="flex-1 min-w-[80px]"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Presente
                            </Button>
                            <Button
                              type="button"
                              variant={att.status === 'Ausente' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() =>
                                handleStatusChange(att.brotherId, 'Ausente')
                              }
                              className="flex-1 min-w-[80px]"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Ausente
                            </Button>
                            <Button
                              type="button"
                              variant={
                                att.status === 'Justificado' ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() =>
                                handleStatusChange(att.brotherId, 'Justificado')
                              }
                              className="flex-1 min-w-[100px]"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Justificado
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Motivo da ausência..."
                            value={att.justification}
                            onChange={(e) =>
                              handleJustificationChange(
                                att.brotherId,
                                e.target.value,
                              )
                            }
                            disabled={att.status === 'Presente'}
                            className={
                              att.status === 'Presente' ? 'opacity-50' : ''
                            }
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <VisitorAttendanceSection
            visitors={visitorList}
            sessionRecordId={existingSessionRecord?.id}
            onAddVisitor={handleAddVisitor}
            onRemoveVisitor={handleRemoveVisitor}
            onPrintCertificate={handlePrintVisitor}
          />

          <div>
            <Label>Observações Gerais</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Anotações sobre a sessão..."
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveInternal}>Salvar Registro</Button>
        </DialogFooter>

        {certificateVisitor && event && (
          <div
            id="visitor-certificate-dialog-container"
            className="hidden print:block"
            ref={certificateRef}
          >
            <VisitorCertificateDocument
              visitor={certificateVisitor}
              event={event}
              venerableMaster={venerableMaster}
              chancellor={chancellor}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
