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
  ShieldCheck,
  Image as ImageIcon,
  Loader2,
  Upload,
  Hexagon,
} from 'lucide-react'
import { compressImage } from '@/lib/image-utils'
import { uploadToStorage } from '@/lib/upload-utils'

export function LogoSettings() {
  const { logoUrl, faviconUrl, updateLogo, updateFavicon } =
    useSiteSettingsStore()
  const [lUrl, setLUrl] = useState(logoUrl)
  const [fUrl, setFUrl] = useState(faviconUrl)
  const [isSavingLogo, setIsSavingLogo] = useState(false)
  const [isSavingFavicon, setIsSavingFavicon] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const [faviconError, setFaviconError] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()

  useEffect(() => {
    setLUrl(logoUrl)
  }, [logoUrl])

  useEffect(() => {
    setFUrl(faviconUrl)
    setFaviconError(false) // Reset error when URL changes
  }, [faviconUrl])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      // Compress locally to speed up transfer
      const optimizedFile = await compressImage(file, 512) // Optimize for logo size

      // Attempt robust upload with fallback
      const publicUrl = await uploadToStorage(
        optimizedFile,
        'site-assets',
        'logos',
      )

      setLUrl(publicUrl)
      toast({
        title: 'Upload Concluído',
        description: 'A imagem do logo foi carregada com sucesso.',
      })
    } catch (error) {
      logError('Error uploading logo', error)
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a imagem do logo.',
      })
    } finally {
      setIsUploadingLogo(false)
      // Reset input to allow selecting the same file again if retry is needed
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleFaviconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingFavicon(true)
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsUploadingFavicon(false)
      toast({
        variant: 'destructive',
        title: 'Timeout no Upload',
        description: 'O upload está demorando muito. Tente novamente com uma imagem menor.',
      })
      if (faviconInputRef.current) faviconInputRef.current.value = ''
    }, 30000) // 30 seconds timeout

    try {
      // Favicons should be high quality, recommended 256x256 or 512x512 for best results
      // Browsers will scale down automatically, but higher resolution ensures better quality
      logDebug('Comprimindo imagem do favicon...')
      const optimizedFile = await compressImage(file, 256, 0.9)

      logDebug('Fazendo upload do favicon...')
      const publicUrl = await uploadToStorage(
        optimizedFile,
        'site-assets',
        'favicons',
      )

      clearTimeout(timeoutId)
      setFUrl(publicUrl)
      toast({
        title: 'Upload Concluído',
        description: 'O favicon foi carregado com sucesso.',
      })
    } catch (error) {
      clearTimeout(timeoutId)
      logError('Erro no upload do favicon', error)
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o favicon. Verifique sua conexão e tente novamente.',
      })
    } finally {
      setIsUploadingFavicon(false)
      // Reset input to allow selecting the same file again
      if (faviconInputRef.current) faviconInputRef.current.value = ''
    }
  }

  const handleSaveLogo = async () => {
    setIsSavingLogo(true)
    try {
      await updateLogo(lUrl)
      toast({
        title: 'Logo Atualizado',
        description: 'O logo do site foi atualizado com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o logo.',
      })
    } finally {
      setIsSavingLogo(false)
    }
  }

  const handleSaveFavicon = async () => {
    setIsSavingFavicon(true)
    try {
      await updateFavicon(fUrl)
      toast({
        title: 'Favicon Atualizado',
        description: 'O ícone do navegador foi atualizado com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o favicon.',
      })
    } finally {
      setIsSavingFavicon(false)
    }
  }

  return (
    <div className="grid gap-6">
      {/* Logo Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Logo do Site</CardTitle>
          <CardDescription>
            Exibido no cabeçalho e rodapé. Recomendado formato circular ou
            quadrado (PNG/SVG).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-32 h-32 border-2 border-dashed rounded-full flex items-center justify-center bg-muted/10 overflow-hidden relative group p-4 ring-2 ring-offset-2 ring-primary/10">
                {isUploadingLogo ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : lUrl ? (
                  <img
                    src={lUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = ''
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <ShieldCheck className="w-16 h-16 text-primary/50" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Pré-visualização
              </span>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                <Label htmlFor="logo-url">URL da Imagem</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="logo-url"
                      placeholder="https://..."
                      className="pl-9"
                      value={lUrl}
                      onChange={(e) => setLUrl(e.target.value)}
                      disabled={isUploadingLogo}
                    />
                  </div>
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    title="Upload"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSaveLogo}
                disabled={isSavingLogo || isUploadingLogo}
              >
                {isSavingLogo && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Logo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Favicon (Ícone da Aba)</CardTitle>
          <CardDescription>
            Pequeno ícone exibido na aba do navegador. Recomendado 64x64px.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 border rounded-md flex items-center justify-center bg-muted/10 overflow-hidden relative">
                {isUploadingFavicon ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : fUrl && !faviconError ? (
                  <img
                    src={fUrl}
                    alt="Favicon"
                    className="w-full h-full object-contain p-1"
                    onError={() => {
                      logError('Erro ao carregar favicon', { url: fUrl })
                      setFaviconError(true)
                    }}
                    onLoad={() => {
                      logDebug('Favicon carregado com sucesso', { url: fUrl })
                      setFaviconError(false)
                    }}
                  />
                ) : (
                  <Hexagon className="w-8 h-8 text-muted-foreground/50" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">Browser Tab</span>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                <Label htmlFor="favicon-url">URL do Ícone</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="favicon-url"
                      placeholder="https://..."
                      className="pl-9"
                      value={fUrl}
                      onChange={(e) => setFUrl(e.target.value)}
                      disabled={isUploadingFavicon}
                    />
                  </div>
                  <input
                    type="file"
                    ref={faviconInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={isUploadingFavicon}
                    title="Upload"
                  >
                    {isUploadingFavicon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSaveFavicon}
                disabled={isSavingFavicon || isUploadingFavicon}
              >
                {isSavingFavicon && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Favicon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
