export const LODGE_MATERIAL_CATEGORIES = [
  'ritual',
  'pin',
  'avental',
  'luva',
  'outro',
] as const

export type LodgeMaterialCategory = (typeof LODGE_MATERIAL_CATEGORIES)[number]

export const LODGE_MATERIAL_CATEGORY_LABELS: Record<LodgeMaterialCategory, string> =
  {
    ritual: 'Ritual',
    pin: 'Pin',
    avental: 'Avental',
    luva: 'Luva',
    outro: 'Outro',
  }

export const LODGE_MATERIAL_MOVEMENT_TYPES = [
  'entrada',
  'saida',
  'ajuste',
] as const

export type LodgeMaterialMovementType =
  (typeof LODGE_MATERIAL_MOVEMENT_TYPES)[number]

export const LODGE_MATERIAL_MOVEMENT_LABELS: Record<
  LodgeMaterialMovementType,
  string
> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
}

export interface LodgeMaterial {
  id: string
  name: string
  category: LodgeMaterialCategory
  unit: string
  quantityOnHand: number
  minimumQuantity: number
  notes: string
  isActive: boolean
  updatedAt: string
}

export interface LodgeMaterialMovement {
  id: string
  materialId: string
  movementType: LodgeMaterialMovementType
  quantity: number
  quantityBefore: number
  quantityAfter: number
  brotherId: string | null
  reason: string
  movedAt: string
}

export interface LodgeMaterialInput {
  name: string
  category: LodgeMaterialCategory
  unit: string
  minimumQuantity: number
  notes: string
  initialQuantity?: number
}

export interface LodgeMaterialMovementInput {
  materialId: string
  movementType: LodgeMaterialMovementType
  quantity: number
  brotherId?: string | null
  reason?: string
}

export function isLodgeMaterialCategory(
  value: string,
): value is LodgeMaterialCategory {
  return (LODGE_MATERIAL_CATEGORIES as readonly string[]).includes(value)
}

export function isLodgeMaterialMovementType(
  value: string,
): value is LodgeMaterialMovementType {
  return (LODGE_MATERIAL_MOVEMENT_TYPES as readonly string[]).includes(value)
}

export function isMaterialBelowMinimum(material: LodgeMaterial): boolean {
  return material.quantityOnHand < material.minimumQuantity
}

export function validateLodgeMaterialInput(
  input: LodgeMaterialInput,
): string | null {
  const name = input.name.trim()
  const unit = input.unit.trim()
  if (name.length < 2) return 'Informe o nome do material (mínimo 2 caracteres).'
  if (name.length > 120) return 'Nome do material muito longo.'
  if (!isLodgeMaterialCategory(input.category)) return 'Categoria inválida.'
  if (unit.length < 1 || unit.length > 20) return 'Informe a unidade (ex.: un).'
  if (
    !Number.isInteger(input.minimumQuantity) ||
    input.minimumQuantity < 0
  ) {
    return 'Estoque mínimo deve ser zero ou mais.'
  }
  if (input.notes.trim().length > 400) return 'Observações muito longas.'
  if (
    input.initialQuantity !== undefined &&
    (!Number.isInteger(input.initialQuantity) || input.initialQuantity < 0)
  ) {
    return 'Quantidade inicial deve ser zero ou mais.'
  }
  return null
}

export function validateLodgeMaterialMovementInput(
  input: LodgeMaterialMovementInput,
  currentQuantity: number,
): string | null {
  if (!input.materialId.trim()) return 'Material não informado.'
  if (!isLodgeMaterialMovementType(input.movementType)) {
    return 'Tipo de movimento inválido.'
  }
  if (!Number.isInteger(input.quantity)) {
    return 'Informe uma quantidade inteira.'
  }
  if (input.movementType === 'ajuste') {
    if (input.quantity < 0) return 'O novo saldo deve ser zero ou mais.'
  } else if (input.quantity <= 0) {
    return 'Informe uma quantidade positiva.'
  }
  if (input.movementType === 'saida' && input.quantity > currentQuantity) {
    return 'Estoque insuficiente para a saída.'
  }
  if ((input.reason ?? '').trim().length > 400) {
    return 'Motivo muito longo.'
  }
  return null
}

export function previewQuantityAfterMovement(
  currentQuantity: number,
  movementType: LodgeMaterialMovementType,
  quantity: number,
): number {
  if (movementType === 'entrada') return currentQuantity + quantity
  if (movementType === 'saida') return currentQuantity - quantity
  return quantity
}
