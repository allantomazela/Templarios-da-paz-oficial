import { describe, expect, it } from 'vitest'
import {
  canAccessDegree,
  getAccessibleDegrees,
  resolveEffectiveMasonicDegree,
} from './masonic-degree'

describe('masonic-degree', () => {
  it('prioriza grau do cadastro brothers sobre o perfil', () => {
    expect(
      resolveEffectiveMasonicDegree('Mestre', 'Companheiro'),
    ).toBe('Mestre')
  })

  it('usa perfil quando não há brothers', () => {
    expect(resolveEffectiveMasonicDegree(null, 'Companheiro')).toBe(
      'Companheiro',
    )
  })

  it('Mestre acessa todos os graus de material', () => {
    expect(canAccessDegree('Mestre', 'Aprendiz')).toBe(true)
    expect(canAccessDegree('Mestre', 'Companheiro')).toBe(true)
    expect(canAccessDegree('Mestre', 'Mestre')).toBe(true)
    expect(getAccessibleDegrees('Mestre')).toEqual([
      'Aprendiz',
      'Companheiro',
      'Mestre',
    ])
  })

  it('Companheiro não acessa material de Mestre', () => {
    expect(canAccessDegree('Companheiro', 'Mestre')).toBe(false)
    expect(canAccessDegree('Companheiro', 'Companheiro')).toBe(true)
  })
})
