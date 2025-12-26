import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowUp,
  ArrowDown,
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import useSiteSettingsStore, {
  CustomSection,
} from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { CustomSectionDialog } from './CustomSectionDialog'
import { Badge } from '@/components/ui/badge'

const SECTION_LABELS: Record<string, string> = {
  history: 'História e Sobre',
  values: 'Pilares (Missão e Valores)',
  venerables: 'Galeria de Veneráveis',
  news: 'Notícias e Eventos',
  contact: 'Contato',
  masters: 'Galeria de Veneráveis (Legado)',
}

export function LayoutSettings() {
  const {
    sectionOrder,
    customSections,
    updateLayout,
    addCustomSection,
    updateCustomSection,
    deleteCustomSection,
  } = useSiteSettingsStore()
  const { toast } = useToast()
  const [items, setItems] = useState<string[]>(sectionOrder)
  const dialog = useDialog()
  const [selectedSection, setSelectedSection] = useState<CustomSection | null>(
    null,
  )

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

  const saveCustomSectionOperation = useAsyncOperation({
    operation: async (data: {
      title: string
      content: string
      type: 'text' | 'text-image' | 'image-text' | 'full-width'
      imageUrl?: string
      backgroundColor?: string
      textColor?: string
      visible: boolean
    }) => {
      if (selectedSection) {
        await updateCustomSection({
          ...selectedSection,
          ...data,
        })
      } else {
        const maxOrder =
          customSections.length > 0
            ? Math.max(...customSections.map((s) => s.order))
            : -1
        await addCustomSection({
          ...data,
          order: maxOrder + 1,
        })
      }
    },
    onSuccess: () => {
      toast({
        title: selectedSection ? 'Seção Atualizada' : 'Seção Criada',
        description: selectedSection
          ? 'A seção customizada foi atualizada com sucesso.'
          : 'A nova seção customizada foi criada com sucesso.',
      })
      dialog.closeDialog()
      setSelectedSection(null)
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar a seção.',
      })
    },
  })

  const deleteCustomSectionOperation = useAsyncOperation({
    operation: async (id: string) => {
      await deleteCustomSection(id)
    },
    onSuccess: () => {
      toast({
        title: 'Seção Removida',
        description: 'A seção customizada foi removida com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error?.message || 'Não foi possível remover a seção.',
      })
    },
  })

  const handleOpenDialog = (section?: CustomSection) => {
    setSelectedSection(section || null)
    dialog.openDialog()
  }

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        'Tem certeza que deseja remover esta seção customizada?',
      )
    ) {
      deleteCustomSectionOperation.execute(id)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Apenas Texto',
      'text-image': 'Texto + Imagem',
      'image-text': 'Imagem + Texto',
      'full-width': 'Largura Total',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Seções Padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Seções Padrão</CardTitle>
          <CardDescription>
            Reorganize a ordem em que as seções padrão aparecem no site público.
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

      {/* Seções Customizadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seções Customizadas</CardTitle>
              <CardDescription>
                Crie e gerencie seções personalizadas para adicionar à página
                inicial.
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Seção
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma seção customizada criada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Nova Seção" para criar sua primeira seção
                personalizada.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customSections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-4 border rounded-md bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {section.visible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(section.type)}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(section.id)}
                        disabled={deleteCustomSectionOperation.loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomSectionDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        sectionToEdit={selectedSection}
        onSave={saveCustomSectionOperation.execute}
      />
    </div>
  )
}
