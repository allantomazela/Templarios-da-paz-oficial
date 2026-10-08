import { describe, expect, it } from 'vitest'
import type { Brother } from '@/lib/data'
import { buildSignatureSheetRows } from '@/lib/attendance-signature-sheet'

function brother(overrides: Partial<Brother>): Brother {
  return {
    id: overrides.name ?? 'id',
    name: 'Irmão',
    email: '',
    phone: '',
    degree: 'Mestre',
    role: 'Irmão',
    status: 'Ativo',
    initiationDate: '2020-01-01',
    attendanceRate: 0,
    membershipSituation: 'regular',
    ...overrides,
  }
}

const brothers: Brother[] = [
  brother({ name: 'Mestre B', degree: 'Mestre', cim: ' 123 ' }),
  brother({ name: 'Aprendiz A', degree: 'Aprendiz' }),
  brother({ name: 'Companheiro C', degree: 'Companheiro' }),
  brother({ name: 'Desligado', status: 'Inativo', membershipSituation: 'desligado' }),
  brother({ name: 'Afastado', membershipSituation: 'afastado' }),
]

describe('buildSignatureSheetRows', () => {
  it('sessão de Aprendiz lista todo o quadro ativo em ordem alfabética', () => {
    const rows = buildSignatureSheetRows(brothers, 'Aprendiz')
    expect(rows.map((row) => row.name)).toEqual(['Aprendiz A', 'Companheiro C', 'Mestre B'])
    expect(rows.map((row) => row.order)).toEqual([1, 2, 3])
  })

  it('sessão de Companheiro exclui Aprendizes', () => {
    const rows = buildSignatureSheetRows(brothers, 'Companheiro')
    expect(rows.map((row) => row.name)).toEqual(['Companheiro C', 'Mestre B'])
  })

  it('sessão de Mestre lista somente Mestres', () => {
    const rows = buildSignatureSheetRows(brothers, 'Mestre')
    expect(rows.map((row) => row.name)).toEqual(['Mestre B'])
  })

  it('nunca inclui afastados ou desligados e normaliza o CIM', () => {
    const rows = buildSignatureSheetRows(brothers, 'Aprendiz')
    expect(rows.some((row) => row.name === 'Desligado' || row.name === 'Afastado')).toBe(false)
    expect(rows.find((row) => row.name === 'Mestre B')?.cim).toBe('123')
    expect(rows.find((row) => row.name === 'Aprendiz A')?.cim).toBe('')
  })
})
