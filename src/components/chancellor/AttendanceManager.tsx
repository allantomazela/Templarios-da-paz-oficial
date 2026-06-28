import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Event, SessionRecord } from '@/lib/data'
import useChancellorStore from '@/stores/useChancellorStore'
import { AttendanceDialog } from './AttendanceDialog'
import { QRCheckinScanner } from './QRCheckinScanner'
import {
  CheckCircle,
  Clock,
  CalendarIcon,
  RefreshCw,
  QrCode,
  DoorOpen,
  Loader2,
} from 'lucide-react'
import {
  formatDateBR,
  todayLocalISODate,
} from '@/lib/format-utils'
import { compareChancellorEventsByDateAsc } from '@/lib/chancellor-event-sort'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useChancellorSessionPermissions } from '@/hooks/use-chancellor-session-permissions'
import { useToast } from '@/hooks/use-toast'
import { devLog } from '@/lib/logger'

type SessionDisplayStatus = 'nao_iniciada' | 'aberta' | 'finalizada'

function getSessionDisplayStatus(record?: SessionRecord): SessionDisplayStatus {
  if (!record) return 'nao_iniciada'
  if (record.status === 'Pendente') return 'aberta'
  return 'finalizada'
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
  const dialog = useDialog()
  const scannerDialog = useDialog()

  devLog(`AttendanceManager: Total de eventos no store: ${events.length}`)

  const eventsWithStatus = useMemo(() => {
    const merged = events.map((event) => {
      const record = sessionRecords.find((item) => item.eventId === event.id)
      const displayStatus = getSessionDisplayStatus(record)
      return { event, record, displayStatus }
    })

    merged.sort((left, right) =>
      compareChancellorEventsByDateAsc(left.event, right.event),
    )

    return merged
  }, [events, sessionRecords])

  const todayEvents = useMemo(
    () => eventsWithStatus.filter(({ event }) => event.date === todayLocalISODate()),
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
                <div className="flex items-center gap-2">
                  {renderStatusBadge(displayStatus)}
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

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Controle de Presença</h3>
          <p className="text-sm text-muted-foreground">
            Eventos ordenados do mais antigo ao mais recente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {eventsWithStatus.length} evento{eventsWithStatus.length !== 1 ? 's' : ''}
          </Badge>
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Atualizar lista">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="hidden md:block rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsWithStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhum evento agendado
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Crie eventos na Agenda ou na seção &quot;Agenda da Loja&quot; para registrar
                      presença.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              eventsWithStatus.map(({ event, record, displayStatus }) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {formatDateBR(event.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">{event.type}</div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(displayStatus)}</TableCell>
                  <TableCell className="text-right">
                    {renderActionButton(event, record, displayStatus)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {eventsWithStatus.length === 0 ? (
          <div className="rounded-md border bg-card p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Nenhum evento agendado
            </p>
          </div>
        ) : (
          eventsWithStatus.map(({ event, record, displayStatus }) => (
            <Card key={event.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium leading-tight">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.type}</p>
                  </div>
                  {renderStatusBadge(displayStatus)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  {formatDateBR(event.date)}
                </div>
                {renderActionButton(event, record, displayStatus, true)}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AttendanceDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        event={selectedEvent}
        existingSessionRecord={selectedRecord}
        onSave={handleSave}
        canManageSessions={canManageSessions}
      />

      <QRCheckinScanner
        open={scannerDialog.open}
        onOpenChange={scannerDialog.onOpenChange}
        onSuccess={() => void fetchChancellorData({ force: true })}
      />
    </div>
  )
}
