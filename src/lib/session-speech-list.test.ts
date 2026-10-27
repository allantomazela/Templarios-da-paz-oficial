import { describe, expect, it } from 'vitest'
import type { Brother } from '@/lib/data'
import {
  buildSessionSpeechRows,
  EMPTY_SESSION_SPEECH_FILTERS,
  type SessionSpeechFilters,
} from '@/lib/session-speech-list'

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

function filters(partial: Partial<SessionSpeechFilters>): SessionSpeechFilters {
  return { ...EMPTY_SESSION_SPEECH_FILTERS, ...partial }
}

describe('buildSessionSpeechRows', () => {
  const brothers = [
    brother({
      id: 'allan',
      name: 'Allan',
      dob: '1980-10-26',
      spouseName: 'Ana',
      spouseDob: '1982-10-26',
      children: [{ name: 'Lia', dob: '2010-10-26' }],
      initiationDate: '2010-10-26',
      elevationDate: '2012-10-26',
      exaltationDate: '2014-10-26',
    }),
    brother({
      id: 'fora',
      name: 'Desligado',
      dob: '1980-10-26',
      membershipSituation: 'desligado',
    }),
  ]

  it('sem filtro não gera fala', () => {
    expect(
      buildSessionSpeechRows(brothers, EMPTY_SESSION_SPEECH_FILTERS, '2026-10-26', '2026-10-26'),
    ).toEqual([])
  })

  it('lista aniversário, cunha, sobrinho e graus do quadro ativo', () => {
    const rows = buildSessionSpeechRows(
      brothers,
      filters({
        brother: true,
        spouse: true,
        child: true,
        initiation: true,
        elevation: true,
        exaltation: true,
      }),
      '2026-10-26',
      '2026-10-26',
    )
    expect(rows.map((row) => `${row.speech}:${row.name}`)).toEqual([
      'Aniversário:Allan',
      'Cunha:Ana',
      'Elevação:Allan',
      'Exaltação:Allan',
      'Iniciação:Allan',
      'Sobrinho(a):Lia',
    ])
    expect(rows.some((row) => row.name === 'Desligado')).toBe(false)
    expect(rows.find((row) => row.speech === 'Iniciação')?.link).toBe(
      'Completa 16 anos de iniciação',
    )
  })

  it('omite data em branco e não puxa categoria desmarcada', () => {
    const rows = buildSessionSpeechRows(
      [brother({ id: 'sem', name: 'Sem data', dob: '', initiationDate: '2020-05-01' })],
      filters({ brother: true, initiation: false }),
      '2026-10-01',
      '2026-10-31',
    )
    expect(rows).toEqual([])
  })

  it('inclui só as datas da sociedade que caem no período', () => {
    const rows = buildSessionSpeechRows(
      [],
      filters({ society: true }),
      '2026-10-12',
      '2026-10-18',
    )
    expect(rows.map((row) => row.name)).toEqual([
      'Dia das Crianças',
      'Dia do Médico',
      'Dia do Professor',
    ])
  })
})
