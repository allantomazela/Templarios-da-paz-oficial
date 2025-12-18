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
import { RotateCcw } from 'lucide-react'

// Basic function to convert hex to HSL string for Tailwind
// Note: This is a simplified version. A robust one would handle edge cases.
function hexToHSL(hex: string): string {
  let r = 0,
    g = 0,
    b = 0
  if (hex.length === 4) {
    r = parseInt('0x' + hex[1] + hex[1])
    g = parseInt('0x' + hex[2] + hex[2])
    b = parseInt('0x' + hex[3] + hex[3])
  } else if (hex.length === 7) {
    r = parseInt('0x' + hex[1] + hex[2])
    g = parseInt('0x' + hex[3] + hex[4])
    b = parseInt('0x' + hex[5] + hex[6])
  }
  r /= 255
  g /= 255
  b /= 255
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin
  let h = 0,
    s = 0,
    l = 0

  if (delta === 0) h = 0
  else if (cmax === r) h = ((g - b) / delta) % 6
  else if (cmax === g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4

  h = Math.round(h * 60)
  if (h < 0) h += 360

  l = (cmax + cmin) / 2
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)

  return `${h} ${s}% ${l}%`
}

export function ThemeSettings() {
  const { primaryColor, updateTheme } = useSiteSettingsStore()
  const { toast } = useToast()
  const [color, setColor] = useState(primaryColor)

  useEffect(() => {
    setColor(primaryColor)
  }, [primaryColor])

  const handleSave = async () => {
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
    }
  }

  const handleReset = () => {
    setColor('#0f172a') // Default slate-900 like color or blue '#007AFF'
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
            <RotateCcw className="mr-2 h-4 w-4" /> Restaurar Padrão
          </Button>
          <Button onClick={handleSave}>Salvar Tema</Button>
        </div>
      </CardContent>
    </Card>
  )
}
