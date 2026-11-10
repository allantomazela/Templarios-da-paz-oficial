import { useEffect, useMemo, useState } from 'react'
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
import type { Brother } from '@/lib/data'
import {
  LODGE_MATERIAL_MOVEMENT_LABELS,
  LODGE_MATERIAL_MOVEMENT_TYPES,
  previewQuantityAfterMovement,
  type LodgeMaterial,
  type LodgeMaterialMovementInput,
  type LodgeMaterialMovementType,
} from '@/lib/lodge-materials'

export function MaterialMovementDialog({
  open,
  onOpenChange,
  material,
  brothers,
  initialType = 'entrada',
  busy,
  onSave,
}: MaterialMovementDialogProps) {
  const [movementType, setMovementType] =
    useState<LodgeMaterialMovementType>(initialType)
  const [quantity, setQuantity] = useState('1')
  const [brotherId, setBrotherId] = useState('none')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open || !material) return
    setMovementType(initialType)
    setQuantity(initialType === 'ajuste' ? String(material.quantityOnHand) : '1')
    setBrotherId('none')
    setReason('')
  }, [open, material, initialType])

  const qtyNumber = Number.parseInt(quantity, 10)
  const preview = useMemo(() => {
    if (!material || !Number.isInteger(qtyNumber)) return null
    if (movementType !== 'ajuste' && qtyNumber <= 0) return null
    if (movementType === 'ajuste' && qtyNumber < 0) return null
    return previewQuantityAfterMovement(
      material.quantityOnHand,
      movementType,
      qtyNumber,
    )
  }, [material, movementType, qtyNumber])

  const handleSave = () => {
    if (!material) return
    const payload: LodgeMaterialMovementInput = {
      materialId: material.id,
      movementType,
      quantity: Number.parseInt(quantity, 10),
      brotherId: brotherId === 'none' ? null : brotherId,
      reason,
    }
    onSave(payload)
  }

  if (!material) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentar estoque</DialogTitle>
          <DialogDescription>
            {material.name} — saldo atual: {material.quantityOnHand}{' '}
            {material.unit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={movementType}
              onValueChange={(value) =>
                setMovementType(value as LodgeMaterialMovementType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LODGE_MATERIAL_MOVEMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {LODGE_MATERIAL_MOVEMENT_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="movement-qty">
              {movementType === 'ajuste' ? 'Novo saldo' : 'Quantidade'}
            </Label>
            <Input
              id="movement-qty"
              type="number"
              min={movementType === 'ajuste' ? 0 : 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {preview !== null && (
              <p className="text-xs text-muted-foreground">
                Após o movimento: {preview} {material.unit}
              </p>
            )}
          </div>
          {movementType === 'saida' && (
            <div className="space-y-2">
              <Label>Entregue a (opcional)</Label>
              <Select value={brotherId} onValueChange={setBrotherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informar</SelectItem>
                  {brothers.map((brother) => (
                    <SelectItem key={brother.id} value={brother.id}>
                      {brother.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="movement-reason">Motivo</Label>
            <Textarea
              id="movement-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ex.: compra, entrega na iniciação, inventário..."
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
            {busy ? 'Registrando...' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MaterialMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: LodgeMaterial | null
  brothers: Brother[]
  initialType?: LodgeMaterialMovementType
  busy: boolean
  onSave: (input: LodgeMaterialMovementInput) => void
}
