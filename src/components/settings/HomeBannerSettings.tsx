import { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { Image as ImageIcon, Loader2, Upload, PanelTop } from 'lucide-react'
import { compressImage } from '@/lib/image-utils'
import { uploadToStorage } from '@/lib/upload-utils'
import { logError } from '@/lib/logger'
import { getSaveErrorMessage } from '@/lib/auth-utils'

export function HomeBannerSettings() {
  const { homeBannerUrl, updateHomeBanner } = useSiteSettingsStore()
  const [url, setUrl] = useState(homeBannerUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setUrl(homeBannerUrl)
  }, [homeBannerUrl])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const optimizedFile = await compressImage(file, 1920, 0.88)
      const publicUrl = await uploadToStorage(
        optimizedFile,
        'site-assets',
        'home-banners',
      )
      setUrl(publicUrl)
      toast({
        title: 'Upload concluído',
        description: 'Imagem carregada. Clique em Salvar para publicar na home.',
      })
    } catch (error) {
      logError('Error uploading home banner', error)
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível enviar a imagem.',
      })
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateHomeBanner(url.trim())
      toast({
        title: 'Faixa atualizada',
        description: url.trim()
          ? 'A imagem abaixo do cabeçalho foi salva.'
          : 'A faixa foi removida da página inicial.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PanelTop className="h-5 w-5" />
          Faixa abaixo do cabeçalho
        </CardTitle>
        <CardDescription>
          Imagem larga exibida na página inicial logo abaixo do menu (opcional). Você pode
          trocar quando quiser por URL ou enviando um novo arquivo — recomendado formato
          paisagem (ex.: 1920×600 px).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border bg-muted/20">
          {url ? (
            <img
              src={url}
              alt="Pré-visualização da faixa"
              className="max-h-48 w-full object-cover object-center sm:max-h-56"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
              Nenhuma imagem configurada
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="home-banner-url">URL da imagem</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="home-banner-url"
                placeholder="https://..."
                className="pl-9"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isUploading}
              />
            </div>
            <input
              type="file"
              ref={inputRef}
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              title="Enviar imagem"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploading}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          {url ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setUrl('')}
              disabled={isSaving || isUploading}
            >
              Limpar pré-visualização
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
