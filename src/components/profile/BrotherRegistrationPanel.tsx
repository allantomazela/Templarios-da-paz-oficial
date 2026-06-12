import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Brother } from '@/lib/data'
import type { Profile } from '@/stores/useAuthStore'
import { BrotherForm } from '@/components/secretariat/BrotherForm'
import type { BrotherFormValues } from '@/lib/brother-form-schema'
import {
  fetchBrotherForProfile,
  saveMyBrotherRegistration,
  type BrotherSaveInput,
} from '@/lib/brothers-api'
import {
  buildBrotherDraftFromProfile,
  isBrotherRegistrationComplete,
  resolveBrotherPhotoFromProfile,
} from '@/lib/brother-registration-utils'
import { syncBrotherPhotoFromProfile } from '@/lib/sync-brother-profile-avatar'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ClipboardList } from 'lucide-react'
import { logError } from '@/lib/logger'

interface BrotherRegistrationPanelProps {
  profile: Profile
  onRegistrationChange?: (complete: boolean) => void
}

export function BrotherRegistrationPanel({
  profile,
  onRegistrationChange,
}: BrotherRegistrationPanelProps) {
  const { updateProfile } = useProfileStore()
  const [brother, setBrother] = useState<Brother | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadBrother = useCallback(async () => {
    if (!profile.id) return

    setLoading(true)
    setLoadError(null)

    try {
      const record = await fetchBrotherForProfile(profile.id, profile.email)
      setBrother(record)
    } catch (error) {
      logError('Error loading brother registration', error)
      setLoadError('Não foi possível carregar seu cadastro. Tente atualizar a página.')
      setBrother(null)
    } finally {
      setLoading(false)
    }
  }, [profile.email, profile.id])

  useEffect(() => {
    void loadBrother()
  }, [loadBrother])

  useEffect(() => {
    if (!profile.id) return
    void syncBrotherPhotoFromProfile(
      profile.id,
      profile.email,
      profile.avatar_url,
    )
  }, [profile.avatar_url, profile.email, profile.id])

  const brotherForForm = useMemo(() => {
    const base = brother ?? buildBrotherDraftFromProfile(profile)
    const syncedPhoto = resolveBrotherPhotoFromProfile(
      profile.avatar_url,
      base.photoUrl,
    )

    return {
      ...base,
      photoUrl: syncedPhoto,
    }
  }, [brother, profile])

  const isComplete = isBrotherRegistrationComplete(brother)

  const saveOperation = useAsyncOperation(
    async (data: BrotherFormValues) => {
      if (!profile.email?.trim()) {
        throw new Error('Sua conta não possui e-mail cadastrado.')
      }

      const saved = await saveMyBrotherRegistration(
        profile.id,
        profile.email.trim(),
        data as BrotherSaveInput,
        brother,
        profile.avatar_url,
      )

      setBrother(saved)
      onRegistrationChange?.(isBrotherRegistrationComplete(saved))

      if (data.name.trim() && data.name.trim() !== profile.full_name) {
        await updateProfile({ full_name: data.name.trim() })
      }

      return 'Cadastro salvo com sucesso!'
    },
    {
      successMessage: 'Cadastro salvo com sucesso!',
      errorMessage: 'Não foi possível salvar seu cadastro.',
    },
  )

  if (loading) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Carregando cadastro completo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {!isComplete && (
        <Alert>
          <ClipboardList className="h-4 w-4" />
          <AlertTitle>Complete seu cadastro</AlertTitle>
          <AlertDescription>
            Preencha todas as informações abaixo — os mesmos dados utilizados pela
            Secretaria em &quot;Editar Irmão&quot;. Isso mantém seu registro atualizado na loja.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cadastro completo do irmão</CardTitle>
          <CardDescription>
            Dados pessoais, maçônicos, familiares e endereço. As alterações ficam
            disponíveis para a Secretaria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrotherForm
            brotherToEdit={brotherForForm}
            profileAvatarUrl={profile.avatar_url}
            userName={profile.full_name}
            onSave={saveOperation.execute}
            isSaving={saveOperation.loading}
            mode="self"
            active
            submitLabel="Salvar cadastro"
          />
        </CardContent>
      </Card>
    </div>
  )
}
