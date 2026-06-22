import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
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
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { formatDateBR } from '@/lib/format-utils'
import { logError } from '@/lib/logger'
import { Check, X, FileText, Users, QrCode, Download } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { VisitorCertificateDocument, VISITOR_CERTIFICATE_PAGE_STYLE } from './VisitorCertificateDocument'
import { VisitorAttendanceSection } from './VisitorAttendanceSection'
import { useToast } from '@/hooks/use-toast'
import {
  brothersWithoutProfileForAttendance,
  profileIdForAttendanceDb,
  attendanceBelongsToBrother,
} from '@/lib/chancellor-attendance'

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
    replaceSessionRecord,
    bulkAddAttendance,
    attendanceRecords,
    brothers,
    bulkAddVisitorAttendance,
    fetchVisitorAttendances,
    saveVisitorAttendances,
    ensureSessionRecordInSupabase,
    fetchAttendanceFromSupabase,
    saveAttendanceToSupabase,
  } = useChancellorStore()
  const { positions, fetchPositions, initialized } = useLodgePositionsStore()
  const { toast } = useToast()
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
  const [showQrDialog, setShowQrDialog] = useState(false)
  const [qrOnlyAttendances, setQrOnlyAttendances] = useState<
    { brotherId: string; status: string; name: string }[]
  >([])
  const [qrSessionRecordId, setQrSessionRecordId] = useState<string | null>(null)
  const [checkinToken, setCheckinToken] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const initSessionKeyRef = useRef<string | null>(null)

  const sessionRecordId = qrSessionRecordId ?? existingSessionRecord?.id
  const checkInUrl =
    typeof window !== 'undefined' && sessionRecordId
      ? `${window.location.origin}/checkin/${sessionRecordId}`
      : ''
  const qrImageUrl =
    checkinToken &&
    `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(checkinToken)}`

  useEffect(() => {
    if (!open || !existingSessionRecord?.id) {
      setCheckinToken(null)
      return
    }
    const run = async () => {
      const { data, error } = await supabase.rpc('get_or_create_checkin_token', {
        p_session_record_id: existingSessionRecord.id,
      })
      if (!error && data) setCheckinToken(data)
    }
    run()
  }, [open, existingSessionRecord?.id])

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
    pageStyle: VISITOR_CERTIFICATE_PAGE_STYLE,
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
    if (open && !initialized) {
      void fetchPositions()
    }
  }, [open, initialized, fetchPositions])

  useEffect(() => {
    if (!open) {
      initSessionKeyRef.current = null
      return
    }

    const initKey = `${event?.id ?? 'no-event'}:${existingSessionRecord?.id ?? 'new'}:${brothers.length}`
    if (initSessionKeyRef.current === initKey) return
    initSessionKeyRef.current = initKey

    if (existingSessionRecord) {
      setObservations(existingSessionRecord.observations)

      const existing = attendanceRecords.filter(
        (ar) => ar.sessionRecordId === existingSessionRecord.id,
      )
      setAttendances(
        brothers.map((b) => {
          const found = existing.find((e) =>
            attendanceBelongsToBrother(b, e.brotherId),
          )
          return {
            brotherId: b.id,
            status: found ? found.status : 'Ausente',
            justification: found ? found.justification || '' : '',
          }
        }),
      )
      setQrOnlyAttendances([])
      void fetchAttendanceFromSupabase(existingSessionRecord.id).then(
        (dbRows) => {
          if (dbRows === null) return
          if (initSessionKeyRef.current !== initKey) return
          setAttendances((prev) =>
            prev.map((p) => {
              const brother = brothers.find((b) => b.id === p.brotherId)
              if (!brother) return p
              const fromDb = dbRows.find((r) =>
                attendanceBelongsToBrother(brother, r.brotherId),
              )
              return fromDb
                ? {
                    ...p,
                    status: fromDb.status as
                      | 'Presente'
                      | 'Ausente'
                      | 'Justificado',
                    justification: fromDb.justification ?? '',
                  }
                : p
            }),
          )
          const brotherIds = new Set(brothers.map((b) => b.id))
          setQrOnlyAttendances(
            dbRows
              .filter((r) => !brotherIds.has(r.brotherId))
              .map((r) => ({
                brotherId: r.brotherId,
                status: r.status,
                name: r.name,
              })),
          )
        },
      )
      void fetchVisitorAttendances(existingSessionRecord.id).then(
        (visitors) => {
          if (visitors === null) return
          if (initSessionKeyRef.current !== initKey) return
          setVisitorList(visitors)
        },
      )
    } else {
      setObservations('')
      setAttendances(
        brothers.map((b) => ({
          brotherId: b.id,
          status: 'Ausente',
          justification: '',
        })),
      )
      setVisitorList([])
      setQrOnlyAttendances([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inicializa só ao abrir o diálogo
  }, [open, event?.id, existingSessionRecord?.id])

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
    if (!event || isSaving) return

    const missingProfiles = brothersWithoutProfileForAttendance(
      brothers,
      attendances.map((a) => a.brotherId),
    )

    let recordId = existingSessionRecord?.id ?? crypto.randomUUID()

    const sessionRecord: SessionRecord = {
      id: recordId,
      eventId: event.id,
      date: event.date,
      charityCollection: existingSessionRecord?.charityCollection ?? 0,
      observations,
      status: 'Finalizada',
    }

    const rowsToSync = attendances
      .map((a) => {
        const profileId = profileIdForAttendanceDb(brothers, a.brotherId)
        if (!profileId) return null
        return {
          brotherId: profileId,
          status: a.status,
          justification: a.justification,
        }
      })
      .filter(
        (
          row,
        ): row is {
          brotherId: string
          status: 'Presente' | 'Ausente' | 'Justificado'
          justification: string
        } => row !== null,
      )

    if (rowsToSync.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description:
          'Nenhum irmão com conta vinculada na Secretaria. Vincule o perfil de usuário antes de registrar presença.',
      })
      return
    }

    setIsSaving(true)
    try {
      const dbRecordId = await ensureSessionRecordInSupabase(event, sessionRecord)
      recordId = dbRecordId

      await saveAttendanceToSupabase(recordId, rowsToSync)

      const newVisitorAttendances: VisitorAttendance[] = visitorList.map(
        (visitor) => ({
          ...visitor,
          sessionRecordId: recordId,
        }),
      )

      try {
        await saveVisitorAttendances(recordId, newVisitorAttendances)
      } catch (visitorError) {
        logError('Erro ao salvar visitantes da sessão', visitorError)
        toast({
          title: 'Presença salva com ressalvas',
          description:
            'Os irmãos foram salvos, mas houve falha ao gravar visitantes.',
        })
      }

      const finalSessionRecord: SessionRecord = {
        ...sessionRecord,
        id: dbRecordId,
      }

      if (existingSessionRecord) {
        if (existingSessionRecord.id !== dbRecordId) {
          replaceSessionRecord(existingSessionRecord.id, finalSessionRecord)
        } else {
          updateSessionRecord(finalSessionRecord)
        }
      } else {
        addSessionRecord(finalSessionRecord)
      }

      const newAttendances: Attendance[] = attendances.map((a) => ({
        id: crypto.randomUUID(),
        sessionRecordId: recordId,
        brotherId: a.brotherId,
        status: a.status,
        justification: a.justification,
      }))
      bulkAddAttendance(newAttendances)
      bulkAddVisitorAttendance(newVisitorAttendances)

      void useChancellorStore.getState().fetchChancellorData({ force: true })

      if (missingProfiles.length > 0) {
        toast({
          title: 'Registro salvo com ressalvas',
          description: `${missingProfiles.length} irmão(s) sem conta vinculada não foram sincronizados: ${missingProfiles.map((b) => b.name).join(', ')}. Vincule em Secretaria.`,
        })
      } else {
        toast({
          title: 'Registro salvo',
          description: 'A presença desta sessão foi atualizada com sucesso.',
        })
      }

      await onSave()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar presença',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o registro. Tente novamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const presentCount = attendances.filter((a) => a.status === 'Presente').length
  const visitorCount = visitorList.length
  const totalBrothers = brothers.length || 1
  const percentage = Math.round((presentCount / totalBrothers) * 100)
  const totalParticipants = presentCount + visitorCount

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Registro de Presença</DialogTitle>
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
                {event?.date ? formatDateBR(event.date) : ''}
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

          {qrOnlyAttendances.length > 0 && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <Label className="mb-2 block text-sm font-medium">
                Check-in por QR (não constam na lista de irmãos)
              </Label>
              <ul className="text-sm text-muted-foreground space-y-1">
                {qrOnlyAttendances.map((a) => (
                  <li key={a.brotherId}>
                    {a.name} — {a.status}
                  </li>
                ))}
              </ul>
            </div>
          )}

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

        <DialogFooter className="mt-4 pt-4 border-t flex-wrap gap-2">
          {existingSessionRecord && event && (
            <Button
              type="button"
              variant="outline"
              className="mr-auto"
              onClick={async () => {
                try {
                  const dbId = await ensureSessionRecordInSupabase(
                    event,
                    existingSessionRecord,
                  )
                  setQrSessionRecordId(dbId)
                  updateSessionRecord({ ...existingSessionRecord, id: dbId })
                  setShowQrDialog(true)
                } catch {
                  setShowQrDialog(true)
                }
              }}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Gerar QR desta sessão
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveInternal} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Registro'}
          </Button>
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

    <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>QR Code para check-in</DialogTitle>
        <p className="text-sm text-muted-foreground">
          Exiba este QR no Templo. Os irmãos escaneiam em Chancelaria → Presença → Escanear QR Code (é necessário estar a até 50 m do Templo).
        </p>
        {qrImageUrl && (
          <div className="flex flex-col items-center gap-3 py-2">
            <img
              src={qrImageUrl}
              alt="QR Code check-in"
              className="rounded border w-64 h-64 object-contain"
            />
            <a
              href={qrImageUrl}
              download="checkin-sessao-qr.png"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar QR
            </a>
            {checkInUrl && (
              <p className="text-xs text-muted-foreground break-all text-center">
                Link alternativo: {checkInUrl}
              </p>
            )}
          </div>
        )}
        {sessionRecordId && !checkinToken && (
          <p className="text-xs text-muted-foreground">Carregando token do QR...</p>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
