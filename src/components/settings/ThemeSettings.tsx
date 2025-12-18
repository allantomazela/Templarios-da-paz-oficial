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
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { RotateCcw, Loader2 } from 'lucide-react'
import { hexToHSL } from '@/lib/utils'

export function ThemeSettings() {
  const { primaryColor, updateTheme } = useSiteSettingsStore()
  const { toast } = useToast()
  const [color, setColor] = useState(primaryColor)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setColor(primaryColor)
  }, [primaryColor])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateTheme(color)
      // Apply immediately to current session
      const hsl = hexToHSL(color)
      document.documentElement.style.setProperty('--primary', hsl)

      toast({
        title: 'Tema Atualizado',
        description: 'A cor primária do site foi alterada.',
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
    // Restoration of the previous blue theme as requested by User Story
    const defaultBlue = '#007AFF'
    setColor(defaultBlue)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalização de Tema</CardTitle>
        <CardDescription>
          Altere a cor principal da marca. Isso afetará botões, links e
          destaques no site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <Label htmlFor="color-picker">Cor Primária</Label>
            <div className="flex gap-2">
              <div className="relative w-12 h-12 rounded-md overflow-hidden border shadow-sm">
                <input
                  id="color-picker"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 m-0 border-0"
                />
              </div>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-32 font-mono uppercase"
                maxLength={7}
              />
            </div>
          </div>
          <div className="flex-1">
            <Label>Pré-visualização</Label>
            <div className="flex gap-2 mt-2">
              <Button style={{ backgroundColor: color }}>Botão Primário</Button>
              <Button
                variant="outline"
                style={{ borderColor: color, color: color }}
              >
                Botão Outline
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Restaurar Padrão (#007AFF)
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Tema
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
