import { useState, useMemo } from 'react'
import { useChancellorStore } from '@/stores/useChancellorStore'
import { Event } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, UserCheck, AlertCircle, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface EventCheckInProps {
  event: Event
}

export function EventCheckIn({ event }: EventCheckInProps) {
  const {
    brothers,
    sessionRecords,
    attendanceRecords,
    addSessionRecord,
    addAttendanceRecord,
    updateAttendanceRecord,
  } = useChancellorStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')

  // Find existing session record for this event
  const sessionRecord = sessionRecords.find((r) => r.eventId === event.id)

  const activeBrothers = useMemo(
    () =>
      brothers
        .filter((b) => b.status === 'Ativo')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [brothers],
  )

  const filteredBrothers = activeBrothers.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getAttendanceStatus = (brotherId: string) => {
    if (!sessionRecord) return null
    return attendanceRecords.find(
      (a) =>
        a.sessionRecordId === sessionRecord.id && a.brotherId === brotherId,
    )?.status
  }

  const handleStartSession = () => {
    addSessionRecord({
      id: crypto.randomUUID(),
      eventId: event.id,
      date: event.date,
      charityCollection: 0,
      observations: '',
      status: 'Pendente',
    })
    toast({
      title: 'Lista Iniciada',
      description: 'A lista de presença foi criada para este evento.',
    })
  }

  const handleToggleAttendance = (brotherId: string) => {
    if (!sessionRecord) return

    const existingRecord = attendanceRecords.find(
      (a) =>
        a.sessionRecordId === sessionRecord.id && a.brotherId === brotherId,
    )

    if (existingRecord) {
      updateAttendanceRecord({
        ...existingRecord,
        status: existingRecord.status === 'Presente' ? 'Ausente' : 'Presente',
      })
    } else {
      addAttendanceRecord({
        id: crypto.randomUUID(),
        sessionRecordId: sessionRecord.id,
        brotherId,
        status: 'Presente',
      })
    }
  }

  // Quorum Stats
  const totalActive = activeBrothers.length
  const totalPresent = sessionRecord
    ? attendanceRecords.filter(
        (a) =>
          a.sessionRecordId === sessionRecord.id && a.status === 'Presente',
      ).length
    : 0
  const quorumPercentage =
    totalActive > 0 ? (totalPresent / totalActive) * 100 : 0

  if (!sessionRecord) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
        <div className="bg-primary/10 p-4 rounded-full">
          <UserCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Lista de Presença</h3>
          <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
            Nenhuma lista de presença foi iniciada para este evento ainda.
          </p>
        </div>
        <Button onClick={handleStartSession}>Iniciar Lista de Presença</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">
              Quorum em Tempo Real
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{totalPresent}</span>
              <span className="text-sm text-muted-foreground">
                / {totalActive} irmãos
              </span>
            </div>
          </div>
          <Badge
            variant={quorumPercentage > 50 ? 'default' : 'secondary'}
            className="mb-1"
          >
            {quorumPercentage.toFixed(0)}%
          </Badge>
        </div>
        <Progress value={quorumPercentage} className="h-2" />
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar irmão..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2 pb-4">
          {filteredBrothers.map((brother) => {
            const status = getAttendanceStatus(brother.id)
            const isPresent = status === 'Presente'

            return (
              <div
                key={brother.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors',
                  isPresent
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card hover:bg-accent/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${brother.id}`}
                    />
                    <AvatarFallback>{brother.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {brother.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {brother.degree}
                    </p>
                  </div>
                </div>

                <Button
                  variant={isPresent ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'w-24 transition-all',
                    isPresent ? 'bg-green-600 hover:bg-green-700' : '',
                  )}
                  onClick={() => handleToggleAttendance(brother.id)}
                >
                  {isPresent ? (
                    <>
                      <Check className="mr-1 h-3 w-3" /> Presente
                    </>
                  ) : (
                    <span className="text-muted-foreground">Ausente</span>
                  )}
                </Button>
              </div>
            )
          })}
          {filteredBrothers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum irmão encontrado.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
