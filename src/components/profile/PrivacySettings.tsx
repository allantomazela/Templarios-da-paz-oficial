import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { Eye, Mail, Phone } from 'lucide-react'

export function PrivacySettings() {
  const { preferences, updatePreferences } = useProfileStore()

  const updateOperation = useAsyncOperation(
    async (newPreferences: typeof preferences) => {
      await updatePreferences({ privacy: newPreferences.privacy })
      return 'Configurações de privacidade atualizadas!'
    },
    {
      successMessage: 'Configurações de privacidade atualizadas!',
      errorMessage: 'Erro ao atualizar configurações.',
    },
  )

  const handleVisibilityChange = (value: string) => {
    updateOperation.execute({
      ...preferences,
      privacy: {
        ...preferences.privacy,
        profileVisibility: value as 'public' | 'members' | 'private',
      },
    })
  }

  const handleToggle = (
    key: 'showEmail' | 'showPhone',
    value: boolean,
  ) => {
    updateOperation.execute({
      ...preferences,
      privacy: {
        ...preferences.privacy,
        [key]: value,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Privacidade</CardTitle>
        <CardDescription>
          Controle quem pode ver suas informações pessoais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="profile-visibility" className="text-base">
              Visibilidade do Perfil
            </Label>
          </div>
          <Select
            value={preferences.privacy.profileVisibility}
            onValueChange={handleVisibilityChange}
            disabled={updateOperation.isLoading}
          >
            <SelectTrigger id="profile-visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Público - Todos podem ver</SelectItem>
              <SelectItem value="members">
                Membros - Apenas membros da loja
              </SelectItem>
              <SelectItem value="private">Privado - Apenas você</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Controla quem pode ver seu perfil no sistema.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="show-email" className="text-base">
                Mostrar Email no Perfil
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Permite que outros membros vejam seu email no seu perfil.
            </p>
          </div>
          <Switch
            id="show-email"
            checked={preferences.privacy.showEmail}
            onCheckedChange={(checked) => handleToggle('showEmail', checked)}
            disabled={updateOperation.isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="show-phone" className="text-base">
                Mostrar Telefone no Perfil
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Permite que outros membros vejam seu telefone no seu perfil.
            </p>
          </div>
          <Switch
            id="show-phone"
            checked={preferences.privacy.showPhone}
            onCheckedChange={(checked) => handleToggle('showPhone', checked)}
            disabled={updateOperation.isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}

