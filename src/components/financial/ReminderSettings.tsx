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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { ReminderSettings as ReminderSettingsModel } from '@/lib/data'
import { Bell, Loader2, Lock, Send } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import {
  fetchMembershipReminderSettings,
  saveMembershipReminderSettings,
} from '@/lib/membership-reminder-settings'
import { MembershipReminderRunsPanel } from '@/components/financial/MembershipReminderRunsPanel'
import { MembershipReminderLogsCard } from '@/components/financial/MembershipReminderLogsCard'
import { MembershipReminderSendDialog } from '@/components/financial/MembershipReminderSendDialog'

export function ReminderSettings() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin' || isMasterAdminEmail(user?.email)

  const [reminderSettings, setReminderSettings] =
    useState<ReminderSettingsModel>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmEnableOpen, setConfirmEnableOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()

  const loadSettings = useCallback(async () => {
    try {
      setReminderSettings(await fetchMembershipReminderSettings())
    } catch (error) {
      console.error('Error loading reminder settings:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar as configurações de lembretes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const persistSettings = useCallback(
    async (next: ReminderSettingsModel): Promise<boolean> => {
      setSaving(true)
      try {
        await saveMembershipReminderSettings(next)
        setReminderSettings(next)
        return true
      } catch (error) {
        console.error('Error saving reminder settings:', error)
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações de lembretes.',
          variant: 'destructive',
        })
        await loadSettings()
        return false
      } finally {
        setSaving(false)
      }
    },
    [loadSettings, toast],
  )

  const setAutomaticSending = async (enabled: boolean) => {
    const saved = await persistSettings({ ...reminderSettings, enabled })
    if (!saved) return
    toast({
      title: enabled ? 'Envio automático ativado' : 'Envio automático desativado',
      description: enabled
        ? 'A partir da próxima verificação diária às 9h (Brasília).'
        : 'Nenhum lembrete será enviado automaticamente.',
    })
  }

  const handleToggle = (checked: boolean) => {
    if (checked) setConfirmEnableOpen(true)
    else void setAutomaticSending(false)
  }

  const handleFrequencyChange = (val: string) => {
    void persistSettings({
      ...reminderSettings,
      frequency: val as ReminderSettingsModel['frequency'],
    })
  }

  const handleDaysChange = (val: string) => {
    setReminderSettings({ ...reminderSettings, days: parseInt(val, 10) || 0 })
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

  const controlsDisabled = !isAdmin || saving

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Lembretes de Mensalidade
          </CardTitle>
          <CardDescription>
            A mensalidade pode ser paga até o último dia do mês de referência,
            sem juros. Cada irmão recebe no máximo <strong>um e-mail por
            mês</strong>. O envio automático vem <strong>desligado</strong> e só
            é ligado por um administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isAdmin ? (
            <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Lock className="h-4 w-4 shrink-0" />
              Somente administradores podem ativar, desativar ou enviar lembretes.
            </p>
          ) : null}

          <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="reminder-mode" className="font-medium">
                Envio automático diário
              </Label>
              <span className="text-xs text-muted-foreground">
                {saving
                  ? 'Salvando configurações...'
                  : reminderSettings.enabled
                    ? 'Ligado: verificação todos os dias às 9h (Brasília).'
                    : 'Desligado: nenhum e-mail é enviado automaticamente.'}
              </span>
            </div>
            <Switch
              id="reminder-mode"
              checked={reminderSettings.enabled}
              onCheckedChange={handleToggle}
              disabled={controlsDisabled}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Momento do envio automático</Label>
              <Select
                value={reminderSettings.frequency}
                onValueChange={handleFrequencyChange}
                disabled={controlsDisabled}
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
                  onBlur={() => void persistSettings(reminderSettings)}
                  disabled={controlsDisabled}
                  className="w-24"
                  min={0}
                  max={28}
                />
                <span className="text-sm text-muted-foreground">
                  dias {reminderSettings.frequency === 'after'
                    ? '(0 = no dia seguinte ao vencimento)'
                    : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium">Envio manual</p>
              <p className="text-xs text-muted-foreground">
                Envia agora para todos os irmãos com mensalidade em atraso,
                mesmo com o automático desligado. Você confere a lista antes.
              </p>
            </div>
            <Button
              onClick={() => setSendDialogOpen(true)}
              disabled={controlsDisabled}
              variant="secondary"
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar lembretes agora
            </Button>
          </div>
        </CardContent>
      </Card>

      <MembershipReminderRunsPanel refreshKey={refreshKey} />
      <MembershipReminderLogsCard refreshKey={refreshKey} />

      <MembershipReminderSendDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onSent={() => setRefreshKey((k) => k + 1)}
      />

      <AlertDialog open={confirmEnableOpen} onOpenChange={setConfirmEnableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar envio automático?</AlertDialogTitle>
            <AlertDialogDescription>
              O sistema passará a verificar todos os dias às 9h (Brasília) e
              enviará e-mails conforme o momento e os dias configurados, até
              que um administrador desligue esta opção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void setAutomaticSending(true)}>
              Ativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const DEFAULT_SETTINGS: ReminderSettingsModel = {
  enabled: false,
  frequency: 'after',
  days: 0,
}
