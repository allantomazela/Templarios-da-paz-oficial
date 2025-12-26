import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { NotificationPreferences } from '@/components/profile/NotificationPreferences'
import { PrivacySettings } from '@/components/profile/PrivacySettings'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { Globe, Palette } from 'lucide-react'

export default function UserSettings() {
  const { user } = useAuthStore()
  const { preferences, fetchProfile, updatePreferences, loading } = useProfileStore()

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  const updateInterfaceOperation = useAsyncOperation(
    async (newPreferences: typeof preferences) => {
      await updatePreferences({ interface: newPreferences.interface })
      return 'Preferências de interface atualizadas!'
    },
    {
      successMessage: 'Preferências de interface atualizadas!',
      errorMessage: 'Erro ao atualizar preferências.',
    },
  )

  const handleLanguageChange = (value: string) => {
    updateInterfaceOperation.execute({
      ...preferences,
      interface: {
        ...preferences.interface,
        language: value as 'pt-BR' | 'en-US',
      },
    })
  }

  const handleThemeChange = (value: string) => {
    updateInterfaceOperation.execute({
      ...preferences,
      interface: {
        ...preferences.interface,
        theme: value as 'light' | 'dark' | 'auto',
      },
    })
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Carregando configurações...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Personalize sua experiência no sistema.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
          <TabsTrigger value="interface">Interface</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="interface" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Interface</CardTitle>
              <CardDescription>
                Configure o idioma e tema da interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="language" className="text-base">
                    Idioma
                  </Label>
                </div>
                <Select
                  value={preferences.interface.language}
                  onValueChange={handleLanguageChange}
                  disabled={updateInterfaceOperation.isLoading}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecione o idioma da interface.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="theme" className="text-base">
                    Tema
                  </Label>
                </div>
                <Select
                  value={preferences.interface.theme}
                  onValueChange={handleThemeChange}
                  disabled={updateInterfaceOperation.isLoading}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático (Sistema)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Escolha o tema visual da interface. O tema automático segue as
                  configurações do seu sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

