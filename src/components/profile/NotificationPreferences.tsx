import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { Bell, Mail, Calendar, MessageSquare } from 'lucide-react'

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useProfileStore()

  const updateOperation = useAsyncOperation(
    async (newPreferences: typeof preferences) => {
      await updatePreferences({ notifications: newPreferences.notifications })
      return 'Preferências atualizadas!'
    },
    {
      successMessage: 'Preferências de notificações atualizadas!',
      errorMessage: 'Erro ao atualizar preferências.',
    },
  )

  const handleToggle = async (
    key: keyof typeof preferences.notifications,
    value: boolean,
  ) => {
    const updated = {
      ...preferences.notifications,
      [key]: value,
    }
    await updateOperation.execute({ ...preferences, notifications: updated })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências de Notificações</CardTitle>
        <CardDescription>
          Configure como você deseja receber notificações do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="push-notifications" className="text-base">
                Notificações Push
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receba notificações no navegador mesmo quando o site estiver fechado.
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={preferences.notifications.push}
            onCheckedChange={(checked) => handleToggle('push', checked)}
            disabled={updateOperation.isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-notifications" className="text-base">
                Notificações por Email
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receba notificações importantes por email.
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.notifications.email}
            onCheckedChange={(checked) => handleToggle('email', checked)}
            disabled={updateOperation.isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="event-notifications" className="text-base">
                Notificações de Eventos
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receba lembretes sobre eventos e reuniões.
            </p>
          </div>
          <Switch
            id="event-notifications"
            checked={preferences.notifications.events}
            onCheckedChange={(checked) => handleToggle('events', checked)}
            disabled={updateOperation.isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="message-notifications" className="text-base">
                Notificações de Mensagens
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receba notificações quando receber mensagens internas.
            </p>
          </div>
          <Switch
            id="message-notifications"
            checked={preferences.notifications.messages}
            onCheckedChange={(checked) => handleToggle('messages', checked)}
            disabled={updateOperation.isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}

