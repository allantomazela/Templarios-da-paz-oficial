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
import { ShieldCheck, Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { compressImage } from '@/lib/image-utils'
import { uploadToStorage } from '@/lib/upload-utils'

export function LogoSettings() {
  const { logoUrl, updateLogo } = useSiteSettingsStore()
  const [url, setUrl] = useState(logoUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setUrl(logoUrl)
  }, [logoUrl])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const optimizedFile = await compressImage(file, 512) // Optimize for logo size
      const publicUrl = await uploadToStorage(
        optimizedFile,
        'site-assets',
        'logos',
      )
      setUrl(publicUrl)
      toast({
        title: 'Upload Concluído',
        description: 'A imagem foi carregada com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: 'Não foi possível carregar a imagem.',
      })
    } finally {
      setIsUploading(false)
      // Reset input value to allow selecting same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateLogo(url)
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
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Logo</CardTitle>
        <CardDescription>
          Defina o logo que será exibido no cabeçalho e rodapé do site público.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/10 overflow-hidden relative group">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : url ? (
                <img
                  src={url}
                  alt="Logo Preview"
                  className="w-full h-full object-contain p-2"
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
              <Label htmlFor="logo-url">URL da Imagem do Logo</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="logo-url"
                    placeholder="https://exemplo.com/logo.png"
                    className="pl-9"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Upload de imagem"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Recomendamos uma imagem PNG com fundo transparente (aprox.
                512x512px).
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alteração
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
