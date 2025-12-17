import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Event,
  SessionRecord,
  Attendance,
  mockBrothers,
  Brother,
} from '@/lib/data'
import useChancellorStore from '@/stores/useChancellorStore'
import useFinancialStore from '@/stores/useFinancialStore'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface AttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  existingSessionRecord: SessionRecord | null
  onSave: () => void
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
  } = useChancellorStore()
  const { addTransaction, accounts } = useFinancialStore()

  const [charityValue, setCharityValue] = useState<number>(0)
  const [observations, setObservations] = useState<string>('')
  const [attendances, setAttendances] = useState<
    {
      brotherId: string
      status: 'Presente' | 'Ausente' | 'Justificado'
      justification: string
    }[]
  >([])

  useEffect(() => {
    if (open) {
      // Initialize state
      if (existingSessionRecord) {
        setCharityValue(existingSessionRecord.charityCollection)
        setObservations(existingSessionRecord.observations)

        // Load existing attendances
        const existing = attendanceRecords.filter(
          (ar) => ar.sessionRecordId === existingSessionRecord.id,
        )
        setAttendances(
          mockBrothers.map((b) => {
            const found = existing.find((e) => e.brotherId === b.id)
            return {
              brotherId: b.id,
              status: found ? found.status : 'Ausente',
              justification: found ? found.justification || '' : '',
            }
          }),
        )
      } else {
        setCharityValue(0)
        setObservations('')
        setAttendances(
          mockBrothers.map((b) => ({
            brotherId: b.id,
            status: 'Ausente', // Default to absent or present? Usually Absent until checked.
            justification: '',
          })),
        )
      }
    }
  }, [open, existingSessionRecord, attendanceRecords])

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

  const handleSaveInternal = () => {
    if (!event) return

    const recordId = existingSessionRecord
      ? existingSessionRecord.id
      : crypto.randomUUID()

    const sessionRecord: SessionRecord = {
      id: recordId,
      eventId: event.id,
      date: event.date,
      charityCollection: charityValue,
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

    // Financial Integration
    // Only if creating new or if value changed (simplification: always add if value > 0 and not tracked - logic for update is complex in mock without ID tracking)
    // For this user story: "automatically create... once saved"
    if (charityValue > 0 && !existingSessionRecord) {
      // Find a default account (e.g., 'Caixa da Tesouraria' or first one)
      const accountId =
        accounts.find((a) => a.type === 'Caixa')?.id || accounts[0]?.id

      addTransaction({
        id: crypto.randomUUID(),
        date: event.date,
        description: `Tronco de Beneficência - Sessão ${format(new Date(event.date), 'dd/MM')}`,
        category: 'Tronco de Beneficência',
        type: 'Receita',
        amount: charityValue,
        accountId: accountId,
      })
    }

    onSave()
    onOpenChange(false)
  }

  const presentCount = attendances.filter((a) => a.status === 'Presente').length
  const percentage = Math.round((presentCount / mockBrothers.length) * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Registro de Presença e Tronco</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
            <div>
              <Label>Evento</Label>
              <div className="text-sm font-medium">{event?.title}</div>
              <div className="text-xs text-muted-foreground">
                {event?.date ? format(new Date(event.date), 'dd/MM/yyyy') : ''}
              </div>
            </div>
            <div>
              <Label>Tronco de Beneficência (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={charityValue}
                onChange={(e) =>
                  setCharityValue(parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="flex flex-col justify-center items-center bg-secondary/20 rounded-md">
              <span className="text-xs text-muted-foreground">
                Presença Atual
              </span>
              <span className="text-2xl font-bold text-primary">
                {percentage}%
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
                    const brother = mockBrothers.find(
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
                          <Select
                            value={att.status}
                            onValueChange={(val: any) =>
                              handleStatusChange(att.brotherId, val)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Presente">Presente</SelectItem>
                              <SelectItem value="Ausente">Ausente</SelectItem>
                              <SelectItem value="Justificado">
                                Justificado
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
      </DialogContent>
    </Dialog>
  )
}
