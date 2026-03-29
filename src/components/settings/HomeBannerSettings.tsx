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
import {
  Image as ImageIcon,
  Loader2,
  Upload,
  PanelTop,
  Landmark,
} from 'lucide-react'
import { compressImage } from '@/lib/image-utils'
import { uploadToStorage } from '@/lib/upload-utils'
import { logError } from '@/lib/logger'
import { getSaveErrorMessage } from '@/lib/auth-utils'

export function HomeBannerSettings() {
  const {
    homeBannerUrl,
    heroCardBgUrl,
    updateHomeBanner,
    updateHeroCardBg,
  } = useSiteSettingsStore()
  const [url, setUrl] = useState(homeBannerUrl)
  const [cardBgUrl, setCardBgUrl] = useState(heroCardBgUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingCard, setIsSavingCard] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingCard, setIsUploadingCard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cardInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setUrl(homeBannerUrl)
  }, [homeBannerUrl])

  useEffect(() => {
    setCardBgUrl(heroCardBgUrl)
  }, [heroCardBgUrl])

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

  const handleUploadCardBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCard(true)
    try {
      const optimizedFile = await compressImage(file, 1600, 0.85)
      const publicUrl = await uploadToStorage(
        optimizedFile,
        'site-assets',
        'hero-card-bg',
      )
      setCardBgUrl(publicUrl)
      toast({
        title: 'Upload concluído',
        description: 'Salve para aplicar o fundo do card do hero.',
      })
    } catch (error) {
      logError('Error uploading hero card bg', error)
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível enviar a imagem.',
      })
    } finally {
      setIsUploadingCard(false)
      if (cardInputRef.current) cardInputRef.current.value = ''
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

  const handleSaveCardBg = async () => {
    setIsSavingCard(true)
    try {
      await updateHeroCardBg(cardBgUrl.trim())
      toast({
        title: 'Fundo do card salvo',
        description: cardBgUrl.trim()
          ? 'A imagem de fundo do card principal foi atualizada.'
          : 'Voltará a usar a imagem padrão (catedral gótica).',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: getSaveErrorMessage(error),
      })
    } finally {
      setIsSavingCard(false)
    }
  }

  return (
    <div className="grid gap-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Fundo do card principal (hero)
          </CardTitle>
          <CardDescription>
            Imagem atrás do título na página inicial (templo, colunas, interior gótico, etc.).
            Se ficar em branco e salvar, o site usa uma imagem padrão de catedral. Recomendado
            formato paisagem ou quadrada, boa iluminação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-muted/20">
            {cardBgUrl ? (
              <img
                src={cardBgUrl}
                alt="Pré-visualização do fundo do card"
                className="max-h-48 w-full object-cover object-center sm:max-h-56"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-1 px-4 text-center text-sm text-muted-foreground">
                <span>Usando imagem padrão (nave gótica)</span>
                <span className="text-xs">Envie uma foto para personalizar.</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-card-bg-url">URL da imagem</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hero-card-bg-url"
                  placeholder="https://..."
                  className="pl-9"
                  value={cardBgUrl}
                  onChange={(e) => setCardBgUrl(e.target.value)}
                  disabled={isUploadingCard}
                />
              </div>
              <input
                type="file"
                ref={cardInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUploadCardBg}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => cardInputRef.current?.click()}
                disabled={isUploadingCard}
                title="Enviar imagem"
              >
                {isUploadingCard ? (
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
              onClick={handleSaveCardBg}
              disabled={isSavingCard || isUploadingCard}
            >
              {isSavingCard && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar fundo do card
            </Button>
            {cardBgUrl ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCardBgUrl('')}
                disabled={isSavingCard || isUploadingCard}
              >
                Usar imagem padrão
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
