import { useEffect, useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { Bell, Loader2 } from 'lucide-react'
import type { PayableReminderSettings as PayableReminderSettingsModel } from '@/lib/financial-payable-types'
import {
  fetchPayableReminderRuns,
  fetchPayableReminderSettings,
  runPayablesRemindersManual,
  savePayableReminderSettings,
  type PayableReminderRun,
} from '@/lib/payable-reminder-settings'
import { formatDateBR } from '@/lib/format-utils'

export function PayableReminderSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<PayableReminderSettingsModel>({
    enabled: false,
    frequency: 'before',
    days: 3,
  })
  const [runs, setRuns] = useState<PayableReminderRun[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [loadedSettings, loadedRuns] = await Promise.all([
        fetchPayableReminderSettings(),
        fetchPayableReminderRuns(),
      ])
      setSettings(loadedSettings)
      setRuns(loadedRuns)
    } catch {
      toast({
        title: 'Erro ao carregar lembretes de contas a pagar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePayableReminderSettings(settings)
      toast({ title: 'Configurações de contas a pagar salvas.' })
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleRunNow = async () => {
    setRunning(true)
    try {
      const result = await runPayablesRemindersManual()
      if (result.ok) {
        toast({
          title: 'Lembretes processados',
          description: result.message ?? `${result.sent ?? 0} e-mail(s) enviado(s).`,
        })
        await load()
      } else {
        toast({
          title: 'Execução não concluída',
          description: result.error ?? result.message ?? 'Verifique se a função está publicada no Supabase.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Falha ao executar lembretes',
        description: 'Erro inesperado ao contactar o servidor.',
        variant: 'destructive',
      })
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando lembretes de contas a pagar...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Lembretes de contas a pagar
        </CardTitle>
        <CardDescription>
          E-mails automáticos para admin/editores sobre boletos e compromissos com vencimento
          próximo ou em atraso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="payable-reminder-enabled">Lembretes automáticos</Label>
            <p className="text-sm text-muted-foreground">
              Verificação diária (job agendado no servidor)
            </p>
          </div>
          <Switch
            id="payable-reminder-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) =>
              setSettings((current) => ({ ...current, enabled: checked }))
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Quando enviar</Label>
            <Select
              value={settings.frequency}
              onValueChange={(value) =>
                setSettings((current) => ({
                  ...current,
                  frequency: value as PayableReminderSettingsModel['frequency'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Antes do vencimento</SelectItem>
                <SelectItem value="on_due">No dia do vencimento</SelectItem>
                <SelectItem value="after">Após o vencimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dias (janela)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={settings.days}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  days: Number(event.target.value) || 0,
                }))
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar configurações
          </Button>
          <Button variant="outline" onClick={() => void handleRunNow()} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Executar agora
          </Button>
        </div>

        {runs.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Últimas execuções</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Alertas</TableHead>
                  <TableHead>Enviados</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{formatDateBR(run.startedAt.slice(0, 10))}</TableCell>
                    <TableCell>{run.source === 'cron' ? 'Automático' : 'Manual'}</TableCell>
                    <TableCell>{run.alertsCount}</TableCell>
                    <TableCell>{run.sentCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {run.error ?? run.message ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
