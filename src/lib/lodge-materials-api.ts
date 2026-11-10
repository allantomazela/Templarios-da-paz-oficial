import { supabase } from '@/lib/supabase/client'
import {
  isLodgeMaterialCategory,
  isLodgeMaterialMovementType,
  validateLodgeMaterialInput,
  validateLodgeMaterialMovementInput,
  type LodgeMaterial,
  type LodgeMaterialInput,
  type LodgeMaterialMovement,
  type LodgeMaterialMovementInput,
} from '@/lib/lodge-materials'

type MaterialRow = {
  id: string
  name: string
  category: string
  unit: string
  quantity_on_hand: number
  minimum_quantity: number
  notes: string | null
  is_active: boolean
  updated_at: string
}

type MovementRow = {
  id: string
  material_id: string
  movement_type: string
  quantity: number
  quantity_before: number
  quantity_after: number
  brother_id: string | null
  reason: string | null
  moved_at: string
}

function mapMaterial(row: MaterialRow): LodgeMaterial {
  return {
    id: row.id,
    name: row.name,
    category: isLodgeMaterialCategory(row.category) ? row.category : 'outro',
    unit: row.unit,
    quantityOnHand: row.quantity_on_hand,
    minimumQuantity: row.minimum_quantity,
    notes: row.notes ?? '',
    isActive: row.is_active,
    updatedAt: row.updated_at,
  }
}

function mapMovement(row: MovementRow): LodgeMaterialMovement {
  return {
    id: row.id,
    materialId: row.material_id,
    movementType: isLodgeMaterialMovementType(row.movement_type)
      ? row.movement_type
      : 'ajuste',
    quantity: row.quantity,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    brotherId: row.brother_id,
    reason: row.reason ?? '',
    movedAt: row.moved_at,
  }
}

export async function listLodgeMaterials(): Promise<LodgeMaterial[]> {
  const { data, error } = await supabase
    .from('lodge_materials')
    .select(
      'id, name, category, unit, quantity_on_hand, minimum_quantity, notes, is_active, updated_at',
    )
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar os materiais.')
  }

  return ((data ?? []) as MaterialRow[]).map(mapMaterial)
}

export async function createLodgeMaterial(
  input: LodgeMaterialInput,
): Promise<LodgeMaterial> {
  const validationError = validateLodgeMaterialInput(input)
  if (validationError) throw new Error(validationError)

  const { data: authData } = await supabase.auth.getUser()
  const initialQuantity = input.initialQuantity ?? 0

  const { data, error } = await supabase
    .from('lodge_materials')
    .insert({
      name: input.name.trim(),
      category: input.category,
      unit: input.unit.trim() || 'un',
      quantity_on_hand: initialQuantity,
      minimum_quantity: input.minimumQuantity,
      notes: input.notes.trim(),
      created_by: authData.user?.id ?? null,
    })
    .select(
      'id, name, category, unit, quantity_on_hand, minimum_quantity, notes, is_active, updated_at',
    )
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Não foi possível cadastrar o material.')
  }

  return mapMaterial(data as MaterialRow)
}

export async function updateLodgeMaterial(
  id: string,
  input: LodgeMaterialInput,
): Promise<LodgeMaterial> {
  const validationError = validateLodgeMaterialInput(input)
  if (validationError) throw new Error(validationError)

  const { data, error } = await supabase
    .from('lodge_materials')
    .update({
      name: input.name.trim(),
      category: input.category,
      unit: input.unit.trim() || 'un',
      minimum_quantity: input.minimumQuantity,
      notes: input.notes.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, name, category, unit, quantity_on_hand, minimum_quantity, notes, is_active, updated_at',
    )
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Não foi possível atualizar o material.')
  }

  return mapMaterial(data as MaterialRow)
}

/** Soft-delete: mantém o histórico de movimentos. */
export async function deactivateLodgeMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('lodge_materials')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message || 'Não foi possível remover o material.')
  }
}

export async function listLodgeMaterialMovements(
  materialId: string,
  limit = 20,
): Promise<LodgeMaterialMovement[]> {
  const { data, error } = await supabase
    .from('lodge_material_movements')
    .select(
      'id, material_id, movement_type, quantity, quantity_before, quantity_after, brother_id, reason, moved_at',
    )
    .eq('material_id', materialId)
    .order('moved_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar o histórico.')
  }

  return ((data ?? []) as MovementRow[]).map(mapMovement)
}

export async function applyLodgeMaterialMovement(
  input: LodgeMaterialMovementInput,
  currentQuantity: number,
): Promise<LodgeMaterialMovement> {
  const validationError = validateLodgeMaterialMovementInput(
    input,
    currentQuantity,
  )
  if (validationError) throw new Error(validationError)

  const { data, error } = await supabase.rpc('apply_lodge_material_movement', {
    p_material_id: input.materialId,
    p_movement_type: input.movementType,
    p_quantity: input.quantity,
    p_brother_id: input.brotherId || null,
    p_reason: (input.reason ?? '').trim(),
  })

  if (error || !data) {
    throw new Error(error?.message || 'Não foi possível registrar o movimento.')
  }

  return mapMovement(data as MovementRow)
}
