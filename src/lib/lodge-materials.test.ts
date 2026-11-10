import { describe, expect, it } from 'vitest'
import {
  isMaterialBelowMinimum,
  previewQuantityAfterMovement,
  validateLodgeMaterialInput,
  validateLodgeMaterialMovementInput,
  type LodgeMaterial,
} from './lodge-materials'

const baseMaterial: LodgeMaterial = {
  id: 'm1',
  name: 'Ritual Aprendiz',
  category: 'ritual',
  unit: 'un',
  quantityOnHand: 3,
  minimumQuantity: 2,
  notes: '',
  isActive: true,
  updatedAt: '2026-11-10T00:00:00Z',
}

describe('validateLodgeMaterialInput', () => {
  it('aceita material válido', () => {
    expect(
      validateLodgeMaterialInput({
        name: 'Pin da Loja',
        category: 'pin',
        unit: 'un',
        minimumQuantity: 5,
        notes: '',
        initialQuantity: 10,
      }),
    ).toBeNull()
  })

  it('rejeita nome curto', () => {
    expect(
      validateLodgeMaterialInput({
        name: 'P',
        category: 'pin',
        unit: 'un',
        minimumQuantity: 0,
        notes: '',
      }),
    ).toMatch(/nome/i)
  })
})

describe('validateLodgeMaterialMovementInput', () => {
  it('bloqueia saída maior que o estoque', () => {
    expect(
      validateLodgeMaterialMovementInput(
        {
          materialId: 'm1',
          movementType: 'saida',
          quantity: 5,
        },
        3,
      ),
    ).toMatch(/insuficiente/i)
  })

  it('permite ajuste para zero', () => {
    expect(
      validateLodgeMaterialMovementInput(
        {
          materialId: 'm1',
          movementType: 'ajuste',
          quantity: 0,
        },
        3,
      ),
    ).toBeNull()
  })
})

describe('previewQuantityAfterMovement', () => {
  it('calcula entrada, saída e ajuste', () => {
    expect(previewQuantityAfterMovement(4, 'entrada', 2)).toBe(6)
    expect(previewQuantityAfterMovement(4, 'saida', 1)).toBe(3)
    expect(previewQuantityAfterMovement(4, 'ajuste', 9)).toBe(9)
  })
})

describe('isMaterialBelowMinimum', () => {
  it('marca estoque baixo', () => {
    expect(isMaterialBelowMinimum(baseMaterial)).toBe(false)
    expect(
      isMaterialBelowMinimum({ ...baseMaterial, quantityOnHand: 1 }),
    ).toBe(true)
  })
})
