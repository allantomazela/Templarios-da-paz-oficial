import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { RotateCcw, Loader2, Type, Palette } from 'lucide-react'
import { hexToHSL } from '@/lib/utils'

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Padrão)', family: 'Inter, sans-serif' },
  { value: 'Roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', family: '"Open Sans", sans-serif' },
  { value: 'Lato', label: 'Lato', family: 'Lato, sans-serif' },
  {
    value: 'Montserrat',
    label: 'Montserrat',
    family: 'Montserrat, sans-serif',
  },
  {
    value: 'Playfair Display',
    label: 'Playfair Display (Serif)',
    family: '"Playfair Display", serif',
  },
  {
    value: 'Merriweather',
    label: 'Merriweather (Serif)',
    family: 'Merriweather, serif',
  },
]

export function ThemeSettings() {
  const { primaryColor, secondaryColor, fontFamily, updateTheme } =
    useSiteSettingsStore()
  const { toast } = useToast()
  const [pColor, setPColor] = useState(primaryColor)
  const [sColor, setSColor] = useState(secondaryColor)
  const [font, setFont] = useState(fontFamily)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setPColor(primaryColor)
    setSColor(secondaryColor || '#1e293b')
    setFont(fontFamily || 'Inter')
  }, [primaryColor, secondaryColor, fontFamily])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateTheme({
        primaryColor: pColor,
        secondaryColor: sColor,
        fontFamily: font,
      })

      // Apply changes immediately for feedback
      const primaryHsl = hexToHSL(pColor)
      const secondaryHsl = hexToHSL(sColor)
      document.documentElement.style.setProperty('--primary', primaryHsl)
      document.documentElement.style.setProperty('--secondary', secondaryHsl)

      const selectedFont = FONT_OPTIONS.find((f) => f.value === font)
      if (selectedFont) {
        document.body.style.fontFamily = selectedFont.family
      }

      toast({
        title: 'Tema Atualizado',
        description: 'As configurações visuais foram salvas com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o tema.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setPColor('#007AFF')
    setSColor('#1e293b')
    setFont('Inter')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalização Visual</CardTitle>
        <CardDescription>
          Defina as cores e a tipografia para alinhar a plataforma à identidade
          visual da loja.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Colors Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Paleta de Cores</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-3 items-center">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring">
                  <input
                    id="primary-color"
                    type="color"
                    value={pColor}
                    onChange={(e) => setPColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                  />
                </div>
                <Input
                  value={pColor}
                  onChange={(e) => setPColor(e.target.value)}
                  className="font-mono uppercase w-32"
                  maxLength={7}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Usada em botões principais, links e destaques.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex gap-3 items-center">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring">
                  <input
                    id="secondary-color"
                    type="color"
                    value={sColor}
                    onChange={(e) => setSColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                  />
                </div>
                <Input
                  value={sColor}
                  onChange={(e) => setSColor(e.target.value)}
                  className="font-mono uppercase w-32"
                  maxLength={7}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Usada em fundos de destaque, barras laterais e elementos de
                apoio.
              </p>
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Type className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Tipografia</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <Label>Família da Fonte</Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A fonte selecionada será aplicada em todo o site.
              </p>
            </div>
            <div className="p-4 border rounded-md bg-muted/10">
              <p className="text-xs text-muted-foreground mb-2">
                Pré-visualização de Texto
              </p>
              <div
                style={{
                  fontFamily:
                    FONT_OPTIONS.find((f) => f.value === font)?.family ||
                    'inherit',
                }}
              >
                <h4 className="text-lg font-bold text-foreground">
                  Augusta e Respeitável Loja
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  "A verdadeira liberdade é aquela que liberta a mente da
                  ignorância e o coração do preconceito."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleReset} type="button">
            <RotateCcw className="mr-2 h-4 w-4" /> Restaurar Padrões
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aplicar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
