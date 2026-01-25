import { useState } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormHeader } from '@/components/ui/form-header'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import { Location } from '@/lib/data'
import { useToast } from '@/hooks/use-toast'

interface LocationManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LocationManagerDialog({
  open,
  onOpenChange,
}: LocationManagerDialogProps) {
  const { locations, addLocation, updateLocation, deleteLocation } =
    useChancellorStore()
  const { toast } = useToast()

  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Location>>({
    name: '',
    capacity: 0,
    description: '',
    equipment: '',
  })

  const openNew = () => {
    setEditingLocation(null)
    setFormData({ name: '', capacity: 0, description: '', equipment: '' })
    setIsFormOpen(true)
  }

  const openEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData(location)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteLocation(id)
    toast({ title: 'Local Removido', description: 'O local foi excluído.' })
  }

  const handleSave = () => {
    if (!formData.name) {
      toast({
        title: 'Erro',
        description: 'Nome do local é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    if (editingLocation) {
      updateLocation({
        ...editingLocation,
        name: formData.name,
        capacity: Number(formData.capacity),
        description: formData.description,
        equipment: formData.equipment,
      })
      toast({
        title: 'Atualizado',
        description: 'Local atualizado com sucesso.',
      })
    } else {
      addLocation({
        id: crypto.randomUUID(),
        name: formData.name,
        capacity: Number(formData.capacity),
        description: formData.description,
        equipment: formData.equipment,
      })
      toast({ title: 'Criado', description: 'Novo local adicionado.' })
    }
    setIsFormOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <FormHeader
          title="Gerenciar Espaços e Locais"
          description="Cadastre e edite os locais disponíveis para eventos da loja."
          icon={<MapPin className="h-5 w-5" />}
        />

        {isFormOpen ? (
          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="font-semibold text-sm">
              {editingLocation ? 'Editar Local' : 'Novo Local'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Local</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Templo Principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidade (Pessoas)</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Breve descrição do espaço"
              />
            </div>
            <div className="space-y-2">
              <Label>Equipamentos Disponíveis</Label>
              <Textarea
                value={formData.equipment}
                onChange={(e) =>
                  setFormData({ ...formData, equipment: e.target.value })
                }
                placeholder="Ex: Projetor, Som, Ar Condicionado..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" /> Novo Local
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Local</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Equipamentos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Nenhum local cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{loc.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {loc.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{loc.capacity} pessoas</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {loc.equipment}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(loc)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(loc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
