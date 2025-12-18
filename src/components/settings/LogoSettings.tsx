import { useState } from 'react'
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
import { ShieldCheck, Image as ImageIcon } from 'lucide-react'

export function LogoSettings() {
  const { logoUrl, updateLogo } = useSiteSettingsStore()
  const [url, setUrl] = useState(logoUrl)
  const { toast } = useToast()

  const handleSave = () => {
    updateLogo(url)
    toast({
      title: 'Logo Atualizado',
      description: 'O logo do site foi atualizado com sucesso.',
    })
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
            <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/10 overflow-hidden relative">
              {url ? (
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
              {url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  {/* Overlay if needed */}
                </div>
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
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Recomendamos uma imagem PNG com fundo transparente (aprox.
                512x512px).
              </p>
            </div>
            <Button onClick={handleSave}>Salvar Alteração</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
