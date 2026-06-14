import { useState, useEffect, useCallback } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ReminderLog, ReminderSettings as ReminderSettingsModel } from '@/lib/data'
import { formatDateBR } from '@/lib/format-utils'
import { Bell, History, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  fetchMembershipReminderSettings,
  runMembershipRemindersManual,
  saveMembershipReminderSettings,
} from '@/lib/membership-reminder-settings'

interface ReminderLogFromDB {
  id: string
  brother_id: string
  contribution_id: string | null
  sent_date: string
  method: 'Email' | 'WhatsApp'
  created_at: string
  profiles?: {
    id: string
    full_name: string | null
  }
}

export function ReminderSettings() {
  const [reminderSettings, setReminderSettings] =
    useState<ReminderSettingsModel>({
      enabled: false,
      frequency: 'after',
      days: 3,
    })
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([])
  const [brotherNames, setBrotherNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabaseAny = supabase as any

  const loadData = useAsyncOperation(
    async () => {
      setLoading(true)
      try {
        const [settings, logsResult] = await Promise.all([
          fetchMembershipReminderSettings(),
          supabaseAny
            .from('reminder_logs')
            .select(
              `
            *,
            profiles!reminder_logs_brother_id_fkey (
              id,
              full_name
            )
          `,
            )
            .order('sent_date', { ascending: false }),
        ])

        if (logsResult.error) throw logsResult.error

        const logsData = logsResult.data as ReminderLogFromDB[] | null
        const mappedLogs: ReminderLog[] = (logsData || []).map(
          (l: ReminderLogFromDB) => ({
            id: l.id,
            brotherId: l.brother_id,
            contributionId: l.contribution_id,
            sentDate: l.sent_date,
            method: l.method,
          }),
        )

        const namesMap: Record<string, string> = {}
        ;(logsData || []).forEach((l: ReminderLogFromDB) => {
          if (l.profiles?.full_name) {
            namesMap[l.brother_id] = l.profiles.full_name
          }
        })

        setReminderSettings(settings)
        setReminderLogs(mappedLogs)
        setBrotherNames(namesMap)
      } catch (error) {
        console.error('Error loading reminder data:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar dados.',
    },
  )

  useEffect(() => {
    loadData.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persistSettings = useCallback(
    async (next: ReminderSettingsModel) => {
      setSaving(true)
      try {
        await saveMembershipReminderSettings(next)
      } catch (error) {
        console.error('Error saving reminder settings:', error)
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações de lembretes.',
          variant: 'destructive',
        })
        await loadData.execute()
      } finally {
        setSaving(false)
      }
    },
    [loadData, toast],
  )

  const handleToggle = (checked: boolean) => {
    const next = { ...reminderSettings, enabled: checked }
    setReminderSettings(next)
    void persistSettings(next)
    toast({
      title: checked ? 'Lembretes Ativados' : 'Lembretes Desativados',
      description: checked
        ? 'Verificação automática diária às 9h (Brasília) e envio manual habilitados.'
        : 'O envio automático foi pausado.',
    })
  }

  const handleFrequencyChange = (val: string) => {
    const next = {
      ...reminderSettings,
      frequency: val as ReminderSettingsModel['frequency'],
    }
    setReminderSettings(next)
    void persistSettings(next)
  }

  const handleDaysChange = (val: string) => {
    const next = {
      ...reminderSettings,
      days: parseInt(val, 10) || 0,
    }
    setReminderSettings(next)
  }

  const handleDaysBlur = () => {
    void persistSettings(reminderSettings)
  }

  const runReminders = useAsyncOperation(
    async () => {
      const result = await runMembershipRemindersManual()
      if (!result.ok) {
        throw new Error(result.error || 'Falha ao enviar lembretes.')
      }
      await loadData.execute()
      return result.message || 'Verificação concluída.'
    },
    {
      successMessage: 'Verificação concluída!',
      errorMessage: 'Falha ao enviar lembretes.',
    },
  )

  const handleRunNow = () => {
    runReminders.execute()
  }

  const getBrotherName = (id: string) => {
    return brotherNames[id] || 'Desconhecido'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando configurações de lembretes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Configuração de Lembretes Automáticos
          </CardTitle>
          <CardDescription>
            Com o envio automático ativo, o sistema verifica diariamente às{' '}
            <strong>9h (horário de Brasília)</strong> e envia e-mail (Resend)
            conforme o cronograma de mensalidades. Use o botão abaixo para
            executar a mesma verificação manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="reminder-mode" className="font-medium">
                Ativar Envio Automático
              </Label>
              <span className="text-xs text-muted-foreground">
                {saving
                  ? 'Salvando configurações...'
                  : 'Persistido no servidor — vale para o job diário e para o envio manual.'}
              </span>
            </div>
            <Switch
              id="reminder-mode"
              checked={reminderSettings.enabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Momento do Envio</Label>
              <Select
                value={reminderSettings.frequency}
                onValueChange={handleFrequencyChange}
                disabled={!reminderSettings.enabled || saving}
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
                  onBlur={handleDaysBlur}
                  disabled={!reminderSettings.enabled || saving}
                  className="w-24"
                  min={0}
                  max={28}
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleRunNow}
              disabled={
                !reminderSettings.enabled ||
                runReminders.loading ||
                saving
              }
              variant="secondary"
            >
              {runReminders.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Executar Verificação Agora'
              )}
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
                      <TableCell>{formatDateBR(log.sentDate)}</TableCell>
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
