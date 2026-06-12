import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar, Eye, Loader2 } from 'lucide-react'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { ConsumptionManager } from './ConsumptionManager'
import { useDialog } from '@/hooks/use-dialog'
import { formatDateBR } from '@/lib/format-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgapePermissions } from '@/hooks/use-agape-permissions'

/**
 * Painel para Mestre de Banquete e diretoria registrarem consumos dos irmãos.
 */
export function AgapeRecordPanel() {
  const { sessions, loading } = useAgapeStore()
  const { isAgapeController, currentPosition } = useAgapePermissions()
  const consumptionDialog = useDialog()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const openSessions = sessions.filter((s) => s.status === 'open')

  const handleOpenConsumptions = (sessionId: string) => {
    setSelectedSession(sessionId)
    consumptionDialog.openDialog()
  }

  const roleHint =
    currentPosition === 'mestre_banquete'
      ? 'Você é o Mestre de Banquete responsável pelo controle do ágape.'
      : isAgapeController
        ? 'Você tem controle total do módulo de ágape.'
        : 'Como membro da diretoria, você pode registrar consumos dos irmãos nas sessões abertas.'

  if (loading && !consumptionDialog.open) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registrar consumos dos irmãos
          </CardTitle>
          <CardDescription>{roleHint}</CardDescription>
        </CardHeader>
        <CardContent>
          {openSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Não há sessões de ágape abertas. O Mestre de Banquete precisa abrir
              uma sessão antes de registrar consumos.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {formatDateBR(session.date)}
                      </TableCell>
                      <TableCell>{session.description || '—'}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          Aberta
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenConsumptions(session.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lançar consumos
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSession && (
        <ConsumptionManager
          open={consumptionDialog.open}
          onOpenChange={(open) => {
            consumptionDialog.onOpenChange(open)
            if (!open) setSelectedSession(null)
          }}
          sessionId={selectedSession}
        />
      )}
    </div>
  )
}
