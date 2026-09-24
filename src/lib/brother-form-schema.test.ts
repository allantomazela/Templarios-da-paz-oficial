import { describe, expect, it } from 'vitest'
import { brotherFormSchema, toBrotherSaveInput } from './brother-form-schema'
import { mapBrotherFromDB, mapBrotherToDB } from './brother-mappers'
import { coerceMasonicDegree } from './masonic-degree'

describe('brother form grau e potência', () => {
  const baseValid = {
    name: 'João da Silva',
    email: 'joao@example.com',
    phone: '(11) 98888-7777',
    dob: '1990-01-01',
    initiationDate: '2020-01-01',
    children: [],
  }

  it('aceita grau vazio/inválido convertendo para Aprendiz no save', () => {
    const coercedDegree = coerceMasonicDegree('')
    expect(coercedDegree).toBe('Aprendiz')

    const parsed = brotherFormSchema.safeParse({
      ...baseValid,
      degree: coercedDegree,
      obedience: 'GOB',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.degree).toBe('Aprendiz')
      expect(toBrotherSaveInput(parsed.data).obedience).toBe('GOB')
    }
  })

  it('normaliza potência por label legado no save', () => {
    const parsed = brotherFormSchema.safeParse({
      ...baseValid,
      degree: 'Mestre',
      obedience: 'GOB - Grande Oriente do Brasil',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(toBrotherSaveInput(parsed.data).obedience).toBe('GOB')
    }
  })

  it('persiste grau e potência no mapeamento para o banco', () => {
    const input = toBrotherSaveInput(
      brotherFormSchema.parse({
        ...baseValid,
        degree: 'Companheiro',
        obedience: 'GLESP',
      }),
    )
    const db = mapBrotherToDB(input)
    expect(db.degree).toBe('Companheiro')
    expect(db.obedience).toBe('GLESP')

    const fromDb = mapBrotherFromDB({
      id: '1',
      name: input.name,
      email: input.email,
      phone: input.phone,
      degree: db.degree,
      role: 'Irmão',
      status: 'Ativo',
      initiation_date: input.initiationDate,
      attendance_rate: 0,
      obedience: db.obedience,
    })
    expect(fromDb.degree).toBe('Companheiro')
    expect(fromDb.obedience).toBe('GLESP')
  })

  it('coerceMasonicDegree cobre aliases comuns', () => {
    expect(coerceMasonicDegree('Grau III')).toBe('Mestre')
    expect(coerceMasonicDegree('Mestre Instalado')).toBe('Mestre')
    expect(coerceMasonicDegree(undefined)).toBe('Aprendiz')
  })
})
