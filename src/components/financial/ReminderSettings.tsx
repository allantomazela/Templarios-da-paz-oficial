import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import useFinancialStore from '@/stores/useFinancialStore'
import { useToast } from '@/hooks/use-toast'
import { mockBrothers, ReminderLog } from '@/lib/data'
import { format } from 'date-fns'
import { Bell, History, CheckCircle } from 'lucide-react'

export function ReminderSettings() {
  const {
    reminderSettings,
    reminderLogs,
    updateReminderSettings,
    contributions,
    addReminderLog,
  } = useFinancialStore()
  const { toast } = useToast()
  const [isSimulating, setIsSimulating] = useState(false)

  const handleToggle = (checked: boolean) => {
    updateReminderSettings({ ...reminderSettings, enabled: checked })
    toast({
      title: checked ? 'Lembretes Ativados' : 'Lembretes Desativados',
      description: checked
        ? 'O sistema enviará lembretes automáticos.'
        : 'O envio automático foi pausado.',
    })
  }

  const handleFrequencyChange = (val: string) => {
    updateReminderSettings({
      ...reminderSettings,
      frequency: val as any,
    })
  }

  const handleDaysChange = (val: string) => {
    updateReminderSettings({
      ...reminderSettings,
      days: parseInt(val) || 0,
    })
  }

  const simulateReminders = () => {
    setIsSimulating(true)
    // Find pending contributions
    const pending = contributions.filter(
      (c) => c.status === 'Pendente' || c.status === 'Atrasado',
    )

    setTimeout(() => {
      let count = 0
      pending.forEach((p) => {
        // Simple logic: Send if not sent today (mock)
        const alreadySent = reminderLogs.some(
          (l) =>
            l.contributionId === p.id &&
            l.sentDate === format(new Date(), 'yyyy-MM-dd'),
        )

        if (!alreadySent) {
          const log: ReminderLog = {
            id: crypto.randomUUID(),
            brotherId: p.brotherId,
            contributionId: p.id,
            sentDate: format(new Date(), 'yyyy-MM-dd'),
            method: 'Email', // Default
          }
          addReminderLog(log)
          count++
        }
      })

      setIsSimulating(false)
      toast({
        title: 'Verificação Concluída',
        description: `${count} novos lembretes foram enviados.`,
      })
    }, 1500)
  }

  const getBrotherName = (id: string) =>
    mockBrothers.find((b) => b.id === id)?.name || 'Desconhecido'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Configuração de Lembretes Automáticos
          </CardTitle>
          <CardDescription>
            Defina quando os lembretes de pagamento devem ser enviados aos
            irmãos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="reminder-mode" className="font-medium">
                Ativar Envio Automático
              </Label>
              <span className="text-xs text-muted-foreground">
                Quando ativado, o sistema verificará diariamente as pendências.
              </span>
            </div>
            <Switch
              id="reminder-mode"
              checked={reminderSettings.enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Momento do Envio</Label>
              <Select
                value={reminderSettings.frequency}
                onValueChange={handleFrequencyChange}
                disabled={!reminderSettings.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Antes do Vencimento</SelectItem>
                  <SelectItem value="on_due">No Dia do Vencimento</SelectItem>
                  <SelectItem value="after">Após o Vencimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade de Dias</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={reminderSettings.days}
                  onChange={(e) => handleDaysChange(e.target.value)}
                  disabled={!reminderSettings.enabled}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={simulateReminders}
              disabled={isSimulating || !reminderSettings.enabled}
              variant="secondary"
            >
              {isSimulating ? 'Verificando...' : 'Executar Verificação Agora'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Histórico de Envios
          </CardTitle>
          <CardDescription>
            Registro de todos os lembretes enviados pelo sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Irmão</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminderLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Nenhum lembrete enviado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  reminderLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.sentDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{getBrotherName(log.brotherId)}</TableCell>
                      <TableCell>{log.method}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" /> Enviado
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
