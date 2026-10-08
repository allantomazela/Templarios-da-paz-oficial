import { describe, expect, it } from 'vitest'
import {
  countUnjustifiedAbsencesForSessions,
  isBrotherActiveInLodge,
  isUnjustifiedAbsenceForAlert,
  selectBrothersForAttendanceList,
} from '@/lib/chancellor-attendance'
import type { Attendance, Brother } from '@/lib/data'

const brother: Brother = {
  id: 'brother-1',
  profileId: 'profile-1',
  name: 'Irmão Teste',
  email: 'irmao@teste.com',
  phone: '11999999999',
  degree: 'Aprendiz',
  role: 'Irmão',
  status: 'Ativo',
  initiationDate: '2024-01-01',
  attendanceRate: 0,
}

describe('isUnjustifiedAbsenceForAlert', () => {
  it('não alerta quando não há lançamento de presença na sessão', () => {
    expect(isUnjustifiedAbsenceForAlert(undefined)).toBe(false)
  })

  it('não alerta presença ou falta justificada', () => {
    expect(
      isUnjustifiedAbsenceForAlert({ status: 'Presente', justification: '' }),
    ).toBe(false)
    expect(
      isUnjustifiedAbsenceForAlert({
        status: 'Justificado',
        justification: 'Viagem a trabalho',
      }),
    ).toBe(false)
  })

  it('não alerta ausência com texto de justificativa', () => {
    expect(
      isUnjustifiedAbsenceForAlert({
        status: 'Ausente',
        justification: 'Problema de saúde',
      }),
    ).toBe(false)
  })

  it('alerta ausência sem justificativa', () => {
    expect(
      isUnjustifiedAbsenceForAlert({ status: 'Ausente', justification: '' }),
    ).toBe(true)
  })
})

describe('countUnjustifiedAbsencesForSessions', () => {
  const records: Attendance[] = [
    {
      id: '1',
      sessionRecordId: 's1',
      brotherId: 'profile-1',
      status: 'Justificado',
      justification: 'Compromisso profissional',
    },
    {
      id: '2',
      sessionRecordId: 's2',
      brotherId: 'profile-1',
      status: 'Ausente',
    },
    {
      id: '3',
      sessionRecordId: 's3',
      brotherId: 'profile-1',
      status: 'Presente',
    },
  ]

  it('ignora sessões justificadas ou presentes no alerta', () => {
    expect(
      countUnjustifiedAbsencesForSessions(brother, ['s1', 's3'], records),
    ).toBe(0)
  })

  it('conta apenas ausências injustificadas explícitas', () => {
    expect(
      countUnjustifiedAbsencesForSessions(
        brother,
        ['s1', 's2', 's3'],
        records,
      ),
    ).toBe(1)
  })

  it('não conta sessão sem lançamento como ausência injustificada', () => {
    expect(
      countUnjustifiedAbsencesForSessions(brother, ['s2', 's4', 's5'], records),
    ).toBe(1)
  })
})

describe('quadro ativo na chamada', () => {
  const formerBrother: Brother = {
    ...brother,
    id: 'brother-2',
    profileId: 'profile-2',
    name: 'Ex-membro',
    status: 'Inativo',
    membershipSituation: 'desligado',
  }
  const onLeave: Brother = {
    ...brother,
    id: 'brother-3',
    profileId: 'profile-3',
    membershipSituation: 'afastado',
  }

  it('considera ativo apenas quem está Ativo e não afastado/desligado', () => {
    expect(isBrotherActiveInLodge(brother)).toBe(true)
    expect(isBrotherActiveInLodge(formerBrother)).toBe(false)
    expect(isBrotherActiveInLodge(onLeave)).toBe(false)
  })

  it('sessão nova lista somente o quadro ativo', () => {
    expect(
      selectBrothersForAttendanceList([brother, formerBrother, onLeave], []).map((b) => b.id),
    ).toEqual(['brother-1'])
  })

  it('sessão antiga mantém quem já tinha lançamento (pelo id do perfil)', () => {
    expect(
      selectBrothersForAttendanceList(
        [brother, formerBrother, onLeave],
        [{ brotherId: 'profile-2' }],
      ).map((b) => b.id),
    ).toEqual(['brother-1', 'brother-2'])
  })
})
