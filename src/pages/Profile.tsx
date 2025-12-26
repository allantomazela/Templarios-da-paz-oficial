import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { supabase } from '@/lib/supabase/client'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { ProfileInfo } from '@/components/profile/ProfileInfo'
import { PasswordChange } from '@/components/profile/PasswordChange'
import { AccountInfo } from '@/components/profile/AccountInfo'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { logError } from '@/lib/logger'

export default function Profile() {
  const { user } = useAuthStore()
  const { profile, fetchProfile, loading } = useProfileStore()
  const [createdAt, setCreatedAt] = useState<string>()
  const [updatedAt, setUpdatedAt] = useState<string>()

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user?.id])

  const loadProfile = async () => {
    if (!user?.id) return

    try {
      await fetchProfile(user.id)

      // Buscar datas de criação e atualização
      const { data } = await supabase
        .from('profiles')
        .select('created_at, updated_at')
        .eq('id', user.id)
        .single()

      if (data) {
        setCreatedAt(data.created_at)
        setUpdatedAt(data.updated_at)
      }
    } catch (error) {
      logError('Error loading profile', error)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações da conta.
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <AvatarUpload
            currentAvatarUrl={profile.avatar_url}
            userName={profile.full_name}
          />
          <ProfileInfo profile={profile} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <PasswordChange />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <AccountInfo
            profile={profile}
            createdAt={createdAt}
            updatedAt={updatedAt}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

