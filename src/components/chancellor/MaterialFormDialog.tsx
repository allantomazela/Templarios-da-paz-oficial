import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  LODGE_MATERIAL_CATEGORIES,
  LODGE_MATERIAL_CATEGORY_LABELS,
  type LodgeMaterial,
  type LodgeMaterialCategory,
  type LodgeMaterialInput,
} from '@/lib/lodge-materials'

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  busy,
  onSave,
}: MaterialFormDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<LodgeMaterialCategory>('outro')
  const [unit, setUnit] = useState('un')
  const [minimumQuantity, setMinimumQuantity] = useState('0')
  const [initialQuantity, setInitialQuantity] = useState('0')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (material) {
      setName(material.name)
      setCategory(material.category)
      setUnit(material.unit)
      setMinimumQuantity(String(material.minimumQuantity))
      setInitialQuantity(String(material.quantityOnHand))
      setNotes(material.notes)
      return
    }
    setName('')
    setCategory('outro')
    setUnit('un')
    setMinimumQuantity('0')
    setInitialQuantity('0')
    setNotes('')
  }, [open, material])

  const handleSave = () => {
    const payload: LodgeMaterialInput = {
      name,
      category,
      unit,
      minimumQuantity: Number.parseInt(minimumQuantity, 10) || 0,
      notes,
      ...(material
        ? {}
        : { initialQuantity: Number.parseInt(initialQuantity, 10) || 0 }),
    }
    onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {material ? 'Editar material' : 'Novo material'}
          </DialogTitle>
          <DialogDescription>
            Cadastro do item no estoque da loja. O saldo muda por entrada, saída
            ou ajuste.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="material-name">Nome</Label>
            <Input
              id="material-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as LodgeMaterialCategory)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LODGE_MATERIAL_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {LODGE_MATERIAL_CATEGORY_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="material-unit">Unidade</Label>
              <Input
                id="material-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-min">Estoque mínimo</Label>
              <Input
                id="material-min"
                type="number"
                min={0}
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(e.target.value)}
              />
            </div>
          </div>
          {!material && (
            <div className="space-y-2">
              <Label htmlFor="material-initial">Quantidade inicial</Label>
              <Input
                id="material-initial"
                type="number"
                min={0}
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="material-notes">Observações</Label>
            <Textarea
              id="material-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={handleSave}>
            {busy ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MaterialFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: LodgeMaterial | null
  busy: boolean
  onSave: (input: LodgeMaterialInput) => void
}
