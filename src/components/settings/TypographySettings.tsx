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
import { RotateCcw, Loader2, Type, AlignLeft } from 'lucide-react'

export function TypographySettings() {
  const { typography, updateTypography } = useSiteSettingsStore()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [settings, setSettings] = useState({
    letterSpacing: typography.letterSpacing,
    lineHeight: typography.lineHeight,
    fontWeightBase: typography.fontWeightBase,
    fontWeightBold: typography.fontWeightBold,
    fontSizeBase: typography.fontSizeBase,
    textColor: typography.textColor,
    textColorMuted: typography.textColorMuted,
    textTransform: typography.textTransform,
    textDecoration: typography.textDecoration,
  })

  useEffect(() => {
    setSettings({
      letterSpacing: typography.letterSpacing,
      lineHeight: typography.lineHeight,
      fontWeightBase: typography.fontWeightBase,
      fontWeightBold: typography.fontWeightBold,
      fontSizeBase: typography.fontSizeBase,
      textColor: typography.textColor,
      textColorMuted: typography.textColorMuted,
      textTransform: typography.textTransform,
      textDecoration: typography.textDecoration,
    })
  }, [typography])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateTypography(settings)

      // Aplicar mudanças imediatamente
      applyTypographyStyles(settings)

      toast({
        title: 'Tipografia Atualizada',
        description: 'As configurações de tipografia foram salvas com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar as configurações de tipografia.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    const defaults = {
      letterSpacing: '0.01em',
      lineHeight: '1.75',
      fontWeightBase: '400',
      fontWeightBold: '700',
      fontSizeBase: '16px',
      textColor: '#ffffff',
      textColorMuted: '#94a3b8',
      textTransform: 'none',
      textDecoration: 'none',
    }
    setSettings(defaults)
  }

  const applyTypographyStyles = (s: typeof settings) => {
    const root = document.documentElement
    root.style.setProperty('--typography-letter-spacing', s.letterSpacing)
    root.style.setProperty('--typography-line-height', s.lineHeight)
    root.style.setProperty('--typography-font-weight-base', s.fontWeightBase)
    root.style.setProperty('--typography-font-weight-bold', s.fontWeightBold)
    root.style.setProperty('--typography-font-size-base', s.fontSizeBase)
    root.style.setProperty('--typography-text-color', s.textColor)
    root.style.setProperty('--typography-text-color-muted', s.textColorMuted)
    root.style.setProperty('--typography-text-transform', s.textTransform)
    root.style.setProperty('--typography-text-decoration', s.textDecoration)
  }

  // Aplicar preview em tempo real
  useEffect(() => {
    applyTypographyStyles(settings)
  }, [settings])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Configurações Avançadas de Tipografia
        </CardTitle>
        <CardDescription>
          Controle completo sobre espaçamento, cores, tamanhos e estilos de
          texto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Espaçamento */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <AlignLeft className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Espaçamento</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="letter-spacing">
                Espaçamento entre Letras (Letter Spacing)
              </Label>
              <div className="space-y-2">
                <Input
                  id="letter-spacing"
                  value={settings.letterSpacing}
                  onChange={(e) =>
                    setSettings({ ...settings, letterSpacing: e.target.value })
                  }
                  placeholder="0.01em"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: 0.01em, 0.5px, -0.02em
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="line-height">
                Altura da Linha (Line Height)
              </Label>
              <div className="space-y-2">
                <Input
                  id="line-height"
                  value={settings.lineHeight}
                  onChange={(e) =>
                    setSettings({ ...settings, lineHeight: e.target.value })
                  }
                  placeholder="1.75"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: 1.5, 1.75, 2.0
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tamanhos e Pesos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Type className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Tamanhos e Pesos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label htmlFor="font-size-base">Tamanho Base da Fonte</Label>
              <Input
                id="font-size-base"
                value={settings.fontSizeBase}
                onChange={(e) =>
                  setSettings({ ...settings, fontSizeBase: e.target.value })
                }
                placeholder="16px"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="font-weight-base">Peso Normal</Label>
              <Select
                value={settings.fontWeightBase}
                onValueChange={(value) =>
                  setSettings({ ...settings, fontWeightBase: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">300 - Light</SelectItem>
                  <SelectItem value="400">400 - Regular</SelectItem>
                  <SelectItem value="500">500 - Medium</SelectItem>
                  <SelectItem value="600">600 - Semi Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="font-weight-bold">Peso Negrito</Label>
              <Select
                value={settings.fontWeightBold}
                onValueChange={(value) =>
                  setSettings({ ...settings, fontWeightBold: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="600">600 - Semi Bold</SelectItem>
                  <SelectItem value="700">700 - Bold</SelectItem>
                  <SelectItem value="800">800 - Extra Bold</SelectItem>
                  <SelectItem value="900">900 - Black</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cores */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Type className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Cores de Texto</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="text-color">Cor Principal do Texto</Label>
              <div className="flex gap-3 items-center">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border shadow-sm">
                  <input
                    id="text-color"
                    type="color"
                    value={settings.textColor}
                    onChange={(e) =>
                      setSettings({ ...settings, textColor: e.target.value })
                    }
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                  />
                </div>
                <Input
                  value={settings.textColor}
                  onChange={(e) =>
                    setSettings({ ...settings, textColor: e.target.value })
                  }
                  className="font-mono uppercase w-32"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="text-color-muted">Cor de Texto Secundário</Label>
              <div className="flex gap-3 items-center">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border shadow-sm">
                  <input
                    id="text-color-muted"
                    type="color"
                    value={settings.textColorMuted}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        textColorMuted: e.target.value,
                      })
                    }
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                  />
                </div>
                <Input
                  value={settings.textColorMuted}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      textColorMuted: e.target.value,
                    })
                  }
                  className="font-mono uppercase w-32"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transformações */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Type className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Transformações de Texto</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="text-transform">Transformação</Label>
              <Select
                value={settings.textTransform}
                onValueChange={(value) =>
                  setSettings({ ...settings, textTransform: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="uppercase">MAIÚSCULAS</SelectItem>
                  <SelectItem value="lowercase">minúsculas</SelectItem>
                  <SelectItem value="capitalize">
                    Primeira Letra Maiúscula
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="text-decoration">Decoração</Label>
              <Select
                value={settings.textDecoration}
                onValueChange={(value) =>
                  setSettings({ ...settings, textDecoration: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="underline">Sublinhado</SelectItem>
                  <SelectItem value="overline">Sobrelinha</SelectItem>
                  <SelectItem value="line-through">Riscado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 border rounded-md bg-muted/10">
          <p className="text-xs text-muted-foreground mb-3">
            Pré-visualização em Tempo Real
          </p>
          <div
            style={{
              letterSpacing: settings.letterSpacing,
              lineHeight: settings.lineHeight,
              fontSize: settings.fontSizeBase,
              fontWeight: settings.fontWeightBase,
              color: settings.textColor,
              textTransform: settings.textTransform,
              textDecoration: settings.textDecoration,
            }}
          >
            <h4
              style={{
                fontWeight: settings.fontWeightBold,
                marginBottom: '0.5rem',
              }}
            >
              Augusta e Respeitável Loja Simbólica
            </h4>
            <p
              style={{
                color: settings.textColorMuted,
                fontWeight: settings.fontWeightBase,
              }}
            >
              "A verdadeira liberdade é aquela que liberta a mente da ignorância
              e o coração do preconceito. Trabalhamos pelo aperfeiçoamento moral,
              intelectual e social da humanidade."
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleReset} type="button">
            <RotateCcw className="mr-2 h-4 w-4" /> Restaurar Padrões
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

