import { describe, expect, it } from 'vitest'
import type { Brother } from '@/lib/data'
import { partitionDegreeRoster } from '@/lib/degree-roster'

function brother(overrides: Partial<Brother>): Brother {
  return {
    id: overrides.id ?? overrides.name ?? 'id',
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

describe('partitionDegreeRoster', () => {
  it('mantém afastados no quadro e separa desligados e in memoriam', () => {
    const roster = partitionDegreeRoster([
      brother({ id: '2', name: 'Bruno', membershipSituation: 'desligado' }),
      brother({ id: '1', name: 'Ana', membershipSituation: 'afastado' }),
      brother({ id: '3', name: 'Caio', membershipSituation: 'in_memoriam' }),
      brother({ id: '4', name: 'Davi', membershipSituation: 'regular' }),
    ])

    expect(roster.active.map((item) => item.name)).toEqual(['Ana', 'Davi'])
    expect(roster.inactive.map((item) => item.name)).toEqual(['Bruno', 'Caio'])
  })
})
