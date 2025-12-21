import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Globe, Search } from 'lucide-react'

export function SeoSettings() {
  const { siteTitle, metaDescription, updateSeo } = useSiteSettingsStore()
  const [title, setTitle] = useState(siteTitle)
  const [description, setDescription] = useState(metaDescription)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setTitle(siteTitle)
    setDescription(metaDescription)
  }, [siteTitle, metaDescription])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSeo({ title, description })
      toast({
        title: 'SEO Atualizado',
        description: 'As configurações de busca foram salvas com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações de SEO.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de SEO & Metadados</CardTitle>
        <CardDescription>
          Defina como o site aparece nos motores de busca (Google) e
          compartilhamentos em redes sociais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-title">Título do Site</Label>
            <div className="relative">
              <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="site-title"
                placeholder="Ex: Templários da Paz - Loja Maçônica"
                className="pl-9"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Aparece na aba do navegador e como título principal nos resultados
              de busca.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-desc">Descrição (Meta Description)</Label>
            <Textarea
              id="meta-desc"
              placeholder="Breve descrição da loja e suas atividades..."
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Resumo exibido abaixo do título nos resultados de busca. Ideal
              entre 150-160 caracteres.
            </p>
          </div>
        </div>

        {/* Preview Section */}
        <div className="border rounded-md p-4 bg-muted/10">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Search className="h-3 w-3" /> Pré-visualização Google
          </h4>
          <div className="bg-background p-4 rounded border shadow-sm max-w-xl">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <Globe className="h-3 w-3 text-gray-500" />
                </span>
                <span>templariosdapaz.com.br</span>
              </div>
              <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium truncate">
                {title || 'Título do Site'}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {description ||
                  'Descrição do site aparecerá aqui nos resultados de busca...'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
