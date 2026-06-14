import { useState, useEffect } from 'react'
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
import { ReminderLog, ReminderSettings, Contribution } from '@/lib/data'
import { formatDateBR, todayLocalISODate } from '@/lib/format-utils'
import { Bell, History, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  fetchApprovedBrothers,
  fetchMembershipFeeSettings,
} from '@/lib/contribution-payments'
import {
  buildAllMembershipSchedules,
  buildOverdueBrotherAlerts,
} from '@/lib/membership-schedule'
import { sendMembershipOverdueReminder } from '@/lib/membership-reminders'

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

interface ContributionFromDB {
  id: string
  brother_id: string
  month: number
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  payment_date: string | null
}

export function ReminderSettings() {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    frequency: 'before',
    days: 3,
  })
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [brotherNames, setBrotherNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [isSimulating, setIsSimulating] = useState(false)
  const supabaseAny = supabase as any

  // Load data from Supabase
  const loadData = useAsyncOperation(
    async () => {
      setLoading(true)
      try {
        // Load reminder logs with profiles
        const { data: logsData, error: logsError } = await supabaseAny
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
          .order('sent_date', { ascending: false })

        if (logsError) throw logsError

        const mappedLogs: ReminderLog[] = (logsData || []).map(
          (l: ReminderLogFromDB) => ({
            id: l.id,
            brotherId: l.brother_id,
            contributionId: l.contribution_id,
            sentDate: l.sent_date,
            method: l.method,
          }),
        )

        // Create brother names map
        const namesMap: Record<string, string> = {}
        ;(logsData || []).forEach((l: ReminderLogFromDB) => {
          if (l.profiles?.full_name) {
            namesMap[l.brother_id] = l.profiles.full_name
          }
        })

        // Load contributions
        const { data: contributionsData, error: contributionsError } =
          await supabaseAny
            .from('contributions')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false })

        if (contributionsError) throw contributionsError

        const MONTHS = [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ]

        const mappedContributions: Contribution[] = (contributionsData || []).map(
          (c: ContributionFromDB) => ({
            id: c.id,
            brotherId: c.brother_id,
            month: MONTHS[c.month - 1] || `${c.month}`,
            year: c.year,
            amount: parseFloat(c.amount.toString()),
            status: c.status,
            paymentDate: c.payment_date || undefined,
          }),
        )

        setReminderLogs(mappedLogs)
        setContributions(mappedContributions)
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

  const handleToggle = (checked: boolean) => {
    setReminderSettings({ ...reminderSettings, enabled: checked })
    toast({
      title: checked ? 'Lembretes Ativados' : 'Lembretes Desativados',
      description: checked
        ? 'O sistema enviará lembretes automáticos.'
        : 'O envio automático foi pausado.',
    })
  }

  const handleFrequencyChange = (val: string) => {
    setReminderSettings({
      ...reminderSettings,
      frequency: val as 'before' | 'on_due' | 'after',
    })
  }

  const handleDaysChange = (val: string) => {
    setReminderSettings({
      ...reminderSettings,
      days: parseInt(val) || 0,
    })
  }

  const simulateReminders = useAsyncOperation(
    async () => {
      setIsSimulating(true)
      try {
        const [settings, brothers] = await Promise.all([
          fetchMembershipFeeSettings(),
          fetchApprovedBrothers(),
        ])

        const brotherNames: Record<string, string> = {}
        for (const b of brothers) {
          brotherNames[b.id] = b.full_name?.trim() || 'Sem nome'
        }

        const schedules = buildAllMembershipSchedules(
          contributions,
          brothers.map((b) => ({
            id: b.id,
            full_name: b.full_name,
            created_at: b.created_at,
          })),
          brotherNames,
          settings,
        )

        const alerts = buildOverdueBrotherAlerts(schedules)
        if (alerts.length === 0) {
          return 'Nenhum irmão com mensalidades em atraso no cronograma.'
        }

        const alertBrotherIds = alerts.map((a) => a.brotherId)
        const { data: profiles, error: profilesError } = await supabaseAny
          .from('profiles')
          .select('id, email, full_name')
          .in('id', alertBrotherIds)

        if (profilesError) throw profilesError

        const profileById = new Map<
          string,
          { email: string | null; full_name: string | null }
        >()
        for (const p of profiles || []) {
          profileById.set(p.id, {
            email: p.email,
            full_name: p.full_name,
          })
        }

        let sentCount = 0
        let skippedCount = 0
        let failedCount = 0
        const today = todayLocalISODate()

        for (const alert of alerts) {
          const alreadySent = reminderLogs.some(
            (l) => l.brotherId === alert.brotherId && l.sentDate === today,
          )

          if (alreadySent) {
            skippedCount++
            continue
          }

          const profile = profileById.get(alert.brotherId)
          const email = profile?.email?.trim()
          if (!email) {
            failedCount++
            continue
          }

          const result = await sendMembershipOverdueReminder({
            brotherId: alert.brotherId,
            email,
            fullName: profile?.full_name?.trim() || alert.brotherName,
            overdueLabels: alert.overdueLabels,
            overdueAmount: alert.overdueAmount,
          })

          if (!result.ok) {
            failedCount++
            continue
          }

          if (result.skipped) {
            skippedCount++
            continue
          }

          const { error: logError } = await supabaseAny
            .from('reminder_logs')
            .insert({
              brother_id: alert.brotherId,
              contribution_id: null,
              sent_date: today,
              method: 'Email',
            })

          if (logError) {
            failedCount++
            continue
          }

          sentCount++
        }

        await loadData.execute()

        const parts = [`${sentCount} lembrete(s) enviado(s) por e-mail.`]
        if (skippedCount > 0) {
          parts.push(`${skippedCount} ignorado(s) (já enviado hoje ou duplicado).`)
        }
        if (failedCount > 0) {
          parts.push(`${failedCount} falha(s) (sem e-mail ou erro no envio).`)
        }
        return parts.join(' ')
      } finally {
        setIsSimulating(false)
      }
    },
    {
      successMessage: 'Verificação concluída!',
      errorMessage: 'Falha ao enviar lembretes.',
    },
  )

  const handleSimulate = () => {
    simulateReminders.execute()
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
            Defina quando os lembretes de pagamento devem ser enviados aos
            irmãos. A verificação manual envia e-mail real (Resend) para quem
            estiver em atraso no cronograma de mensalidades.
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
              onClick={handleSimulate}
              disabled={isSimulating || !reminderSettings.enabled || simulateReminders.loading}
              variant="secondary"
            >
              {isSimulating || simulateReminders.loading ? (
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
                      <TableCell>
                        {formatDateBR(log.sentDate)}
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
