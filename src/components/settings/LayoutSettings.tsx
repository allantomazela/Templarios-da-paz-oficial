import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'

const SECTION_LABELS: Record<string, string> = {
  history: 'História e Sobre',
  values: 'Pilares (Missão e Valores)',
  venerables: 'Galeria de Veneráveis',
  news: 'Notícias e Eventos',
  contact: 'Contato',
  masters: 'Galeria de Veneráveis (Legado)',
}

export function LayoutSettings() {
  const { sectionOrder, updateLayout } = useSiteSettingsStore()
  const { toast } = useToast()
  const [items, setItems] = useState<string[]>(sectionOrder)

  useEffect(() => {
    if (sectionOrder.length > 0) {
      // Ensure 'news' is in the list if missing (migration compat)
      let current = [...sectionOrder]
      if (!current.includes('news')) current.push('news')

      // Ensure 'values' is in the list
      if (!current.includes('values')) {
        const historyIdx = current.indexOf('history')
        if (historyIdx !== -1) {
          current.splice(historyIdx + 1, 0, 'values')
        } else {
          current.unshift('values')
        }
      }

      // Filter out 'masters' if 'venerables' is used, or normalize
      if (current.includes('masters') && !current.includes('venerables')) {
        current = current.map((c) => (c === 'masters' ? 'venerables' : c))
      }

      setItems(current)
    }
  }, [sectionOrder])

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items]
    if (direction === 'up' && index > 0) {
      const temp = newItems[index - 1]
      newItems[index - 1] = newItems[index]
      newItems[index] = temp
    } else if (direction === 'down' && index < newItems.length - 1) {
      const temp = newItems[index + 1]
      newItems[index + 1] = newItems[index]
      newItems[index] = temp
    }
    setItems(newItems)
  }

  const handleSave = async () => {
    try {
      await updateLayout(items)
      toast({
        title: 'Layout Atualizado',
        description: 'A ordem das seções da página inicial foi salva.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o layout.',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalizar Layout da Página Inicial</CardTitle>
        <CardDescription>
          Reorganize a ordem em que as seções aparecem no site público.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item}
              className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                <span className="font-medium">
                  {SECTION_LABELS[item] || item}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => moveItem(index, 'up')}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 'down')}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave}>Salvar Ordem</Button>
        </div>
      </CardContent>
    </Card>
  )
}
