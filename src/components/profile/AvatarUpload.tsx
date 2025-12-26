import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, X, User } from 'lucide-react'
import { useImageUpload } from '@/hooks/use-image-upload'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  userName: string
}

export function AvatarUpload({ currentAvatarUrl, userName }: AvatarUploadProps) {
  const { updateAvatar } = useProfileStore()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentAvatarUrl || null,
  )

  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'avatars',
    maxSize: 512,
    quality: 0.85,
    successMessage: 'Avatar atualizado com sucesso.',
    errorMessage: 'Não foi possível atualizar o avatar.',
  })

  const updateOperation = useAsyncOperation(
    async (url: string) => {
      await updateAvatar(url)
      return 'Avatar atualizado com sucesso!'
    },
    {
      successMessage: 'Avatar atualizado com sucesso!',
      errorMessage: 'Erro ao atualizar avatar.',
    },
  )

  useEffect(() => {
    if (currentAvatarUrl) {
      setAvatarPreview(currentAvatarUrl)
    }
  }, [currentAvatarUrl])

  useEffect(() => {
    if (imageUpload.imageUrl) {
      setAvatarPreview(imageUpload.imageUrl)
      updateOperation.execute(imageUpload.imageUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUpload.imageUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await imageUpload.handleUpload(file)
  }

  const handleRemoveAvatar = async () => {
    await updateOperation.execute('')
    setAvatarPreview(null)
    imageUpload.reset()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto de Perfil</CardTitle>
        <CardDescription>
          Faça upload de uma foto para seu perfil. Tamanho recomendado: 512x512px
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarPreview || undefined} alt={userName} />
            <AvatarFallback className="text-2xl">
              {avatarPreview ? (
                <User className="h-12 w-12" />
              ) : (
                getInitials(userName)
              )}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                ref={imageUpload.inputRef}
                onChange={handleFileChange}
                disabled={imageUpload.isUploading || updateOperation.isLoading}
                className="cursor-pointer"
              />
            </div>

            {imageUpload.isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando foto...
              </div>
            )}

            {updateOperation.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando perfil...
              </div>
            )}

            {avatarPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={updateOperation.isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Remover Foto
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

