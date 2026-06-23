import { describe, expect, it } from 'vitest'
import {
  countUnjustifiedAbsencesForSessions,
  isUnjustifiedAbsenceForAlert,
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
  it('considera ausência sem registro como injustificada', () => {
    expect(isUnjustifiedAbsenceForAlert(undefined)).toBe(true)
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

  it('conta apenas ausências injustificadas', () => {
    expect(
      countUnjustifiedAbsencesForSessions(
        brother,
        ['s1', 's2', 's3'],
        records,
      ),
    ).toBe(1)
  })
})
