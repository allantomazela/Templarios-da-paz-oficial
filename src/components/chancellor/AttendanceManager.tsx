import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Event, SessionRecord } from '@/lib/data'
import useChancellorStore from '@/stores/useChancellorStore'
import { AttendanceDialog } from './AttendanceDialog'
import { AttendanceSignatureSheetDialog } from './AttendanceSignatureSheetDialog'
import { AttendanceSignatureSheetBatchDialog } from './AttendanceSignatureSheetBatchDialog'
import { AttendancePresenceList } from './AttendancePresenceList'
import { QRCheckinScanner } from './QRCheckinScanner'
import {
  CheckCircle,
  Clock,
  QrCode,
  DoorOpen,
  Loader2,
  Printer,
} from 'lucide-react'
import { formatDateBR, todayLocalISODate } from '@/lib/format-utils'
import { compareChancellorEventsByDateAsc } from '@/lib/chancellor-event-sort'
import {
  getSessionDisplayStatus,
  type SessionDisplayStatus,
} from '@/lib/attendance-presence-list'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useChancellorSessionPermissions } from '@/hooks/use-chancellor-session-permissions'
import { useToast } from '@/hooks/use-toast'
import { devLog } from '@/lib/logger'

function formatEventTypeWithDegree(event: Event): string {
  return event.degree ? `${event.type} · ${event.degree}` : event.type
}

function sessionStatusLabel(status: SessionDisplayStatus): string {
  switch (status) {
    case 'aberta':
      return 'Aberta'
    case 'finalizada':
      return 'Finalizada'
    default:
      return 'Não iniciada'
  }
}

export function AttendanceManager() {
  const { events, sessionRecords, fetchChancellorData, openSessionForEvent } =
    useChancellorStore()
  const { canManageSessions } = useChancellorSessionPermissions()
  const { toast } = useToast()

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SessionRecord | null>(null)
  const [openingEventId, setOpeningEventId] = useState<string | null>(null)
  const [signatureSheetEvent, setSignatureSheetEvent] = useState<Event | null>(null)
  const dialog = useDialog()
  const scannerDialog = useDialog()
  const signatureSheetDialog = useDialog()
  const signatureSheetBatchDialog = useDialog()

  devLog('log', `AttendanceManager: Total de eventos no store: ${events.length}`)

  const eventsWithStatus = useMemo(() => {
    const merged = events.map((event) => {
      const record = sessionRecords.find((item) => item.eventId === event.id)
      const displayStatus = getSessionDisplayStatus(record)
      return { event, record, displayStatus }
    })

    return merged
  }, [events, sessionRecords])

  const todayEvents = useMemo(
    () =>
      eventsWithStatus
        .filter(({ event }) => event.date === todayLocalISODate())
        .sort((left, right) =>
          compareChancellorEventsByDateAsc(left.event, right.event),
        ),
    [eventsWithStatus],
  )

  const saveOperation = useAsyncOperation(
    async () => 'As informações de presença foram atualizadas com sucesso.',
    {
      successMessage: 'Registro salvo com sucesso!',
      errorMessage: 'Falha ao salvar o registro.',
    },
  )

  const handleOpen = (event: Event, record?: SessionRecord) => {
    setSelectedEvent(event)
    setSelectedRecord(record || null)
    dialog.openDialog()
  }

  const handleSave = async () => {
    await saveOperation.execute()
  }

  const handleRefresh = () => {
    void fetchChancellorData({ force: true })
  }

  const handleOpenSession = async (event: Event, record?: SessionRecord) => {
    if (record && getSessionDisplayStatus(record) === 'finalizada') {
      handleOpen(event, record)
      return
    }

    setOpeningEventId(event.id)
    try {
      const result = await openSessionForEvent(event)
      const openedRecord =
        useChancellorStore
          .getState()
          .sessionRecords.find((item) => item.id === result.sessionRecordId) ?? {
          id: result.sessionRecordId,
          eventId: event.id,
          date: event.date,
          charityCollection: 0,
          observations: '',
          status: 'Pendente' as const,
        }

      toast({
        title: result.alreadyOpen ? 'Sessão já estava aberta' : 'Sessão aberta',
        description: [
          'Os irmãos podem marcar presença pelo menu "Registrar presença" no aplicativo.',
          result.agapeMessage,
        ]
          .filter(Boolean)
          .join(' '),
      })

      handleOpen(event, openedRecord)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível abrir a sessão',
        description:
          error instanceof Error
            ? error.message
            : 'Verifique suas permissões e tente novamente.',
      })
    } finally {
      setOpeningEventId(null)
    }
  }

  const handleOpenSignatureSheet = (event: Event) => {
    setSignatureSheetEvent(event)
    signatureSheetDialog.openDialog()
  }

  const renderSignatureSheetButton = (event: Event, fullWidth = false) => {
    if (!canManageSessions) return null
    return (
      <Button
        size="sm"
        variant="outline"
        className={fullWidth ? 'w-full' : undefined}
        onClick={() => handleOpenSignatureSheet(event)}
        title="Imprimir folha de presença A4 para o livro"
      >
        <Printer className="mr-2 h-4 w-4" />
        Folha A4
      </Button>
    )
  }

  const renderStatusBadge = (displayStatus: SessionDisplayStatus) => {
    if (displayStatus === 'aberta') {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-600">
          {sessionStatusLabel(displayStatus)}
        </Badge>
      )
    }
    if (displayStatus === 'finalizada') {
      return (
        <Badge variant="default" className="bg-green-600">
          {sessionStatusLabel(displayStatus)}
        </Badge>
      )
    }
    return <Badge variant="secondary">{sessionStatusLabel(displayStatus)}</Badge>
  }

  const renderActionButton = (
    event: Event,
    record: SessionRecord | undefined,
    displayStatus: SessionDisplayStatus,
    fullWidth = false,
  ) => {
    const isOpening = openingEventId === event.id

    if (displayStatus === 'finalizada') {
      return (
        <Button
          size="sm"
          variant="outline"
          className={fullWidth ? 'w-full' : undefined}
          onClick={() => handleOpen(event, record)}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Editar
        </Button>
      )
    }

    if (displayStatus === 'aberta') {
      return (
        <Button
          size="sm"
          className={fullWidth ? 'w-full' : undefined}
          onClick={() => handleOpen(event, record)}
        >
          <Clock className="mr-2 h-4 w-4" />
          Gerenciar presença
        </Button>
      )
    }

    if (!canManageSessions) {
      return (
        <Button size="sm" variant="secondary" disabled className={fullWidth ? 'w-full' : undefined}>
          Aguardando abertura
        </Button>
      )
    }

    return (
      <Button
        size="sm"
        className={fullWidth ? 'w-full' : undefined}
        disabled={isOpening}
        onClick={() => void handleOpenSession(event, record)}
      >
        {isOpening ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <DoorOpen className="mr-2 h-4 w-4" />
        )}
        Abrir sessão
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      {canManageSessions && todayEvents.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Sessão do dia</CardTitle>
            <CardDescription>
              Abra a sessão para liberar check-in no aplicativo e lançamento de ágape.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayEvents.map(({ event, record, displayStatus }) => (
              <div
                key={event.id}
                className="flex flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateBR(event.date)} às {event.time?.slice(0, 5) || '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {renderStatusBadge(displayStatus)}
                  {renderSignatureSheetButton(event)}
                  {renderActionButton(event, record, displayStatus)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5" />
            Registrar minha presença
          </CardTitle>
          <CardDescription>
            Com a sessão aberta pelo Chanceler ou Mestre de Banquete, escaneie o QR no Templo
            (até 50 m) ou use o botão &quot;Registrar presença&quot; no menu lateral.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => scannerDialog.openDialog()}>
            <QrCode className="mr-2 h-4 w-4" />
            Escanear QR Code da sessão
          </Button>
        </CardContent>
      </Card>

      <AttendancePresenceList
        items={eventsWithStatus}
        today={todayLocalISODate()}
        showBatch={canManageSessions}
        onRefresh={handleRefresh}
        onOpenBatch={() => signatureSheetBatchDialog.openDialog()}
        renderStatus={renderStatusBadge}
        renderActions={(item, fullWidth) => (
          <>
            {renderSignatureSheetButton(item.event, fullWidth)}
            {renderActionButton(item.event, item.record, item.displayStatus, fullWidth)}
          </>
        )}
      />

      <AttendanceDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        event={selectedEvent}
        existingSessionRecord={selectedRecord}
        onSave={handleSave}
        canManageSessions={canManageSessions}
      />

      <AttendanceSignatureSheetDialog
        open={signatureSheetDialog.open}
        onOpenChange={signatureSheetDialog.onOpenChange}
        event={signatureSheetEvent}
      />

      <AttendanceSignatureSheetBatchDialog
        open={signatureSheetBatchDialog.open}
        onOpenChange={signatureSheetBatchDialog.onOpenChange}
      />

      <QRCheckinScanner
        open={scannerDialog.open}
        onOpenChange={scannerDialog.onOpenChange}
        onSuccess={() => void fetchChancellorData({ force: true })}
      />
    </div>
  )
}
