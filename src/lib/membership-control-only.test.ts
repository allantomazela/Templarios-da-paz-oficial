import { describe, expect, it } from 'vitest'
import {
  buildControlOnlyNotes,
  detectTreasuryModeFromContribution,
  mensalidadeDescriptionMatchesBrother,
  stripControlOnlyNote,
} from '@/lib/membership-control-only'
import {
  isMembershipControlOnlyContribution,
  isOrphanTreasuryContribution,
  MEMBERSHIP_CONTROL_ONLY_NOTE,
} from '@/lib/membership-schedule'

describe('membership-control-only', () => {
  it('monta e remove nota de só controle', () => {
    expect(buildControlOnlyNotes()).toBe(MEMBERSHIP_CONTROL_ONLY_NOTE)
    expect(buildControlOnlyNotes('PIX Stone')).toContain(MEMBERSHIP_CONTROL_ONLY_NOTE)
    expect(buildControlOnlyNotes('PIX Stone')).toContain('PIX Stone')
    expect(stripControlOnlyNote(buildControlOnlyNotes('PIX Stone'))).toBe('PIX Stone')
  })

  it('detecta modo só controle a partir da contribuição', () => {
    expect(
      detectTreasuryModeFromContribution({
        status: 'Pago',
        notes: buildControlOnlyNotes(),
      }),
    ).toBe('control_only')
    expect(
      detectTreasuryModeFromContribution({
        status: 'Pago',
        transactionId: 'tx-1',
      }),
    ).toBe('standard')
  })

  it('identifica mensalidade só controle em jun/2026 sem receita', () => {
    const contribution = {
      status: 'Pago',
      transactionId: null,
      accountId: null,
      notes: buildControlOnlyNotes(),
    }
    expect(isMembershipControlOnlyContribution(2026, 6, contribution)).toBe(true)
    expect(isOrphanTreasuryContribution(2026, 6, contribution)).toBe(false)
  })

  it('casa descrição de mensalidade com nome do irmão', () => {
    expect(
      mensalidadeDescriptionMatchesBrother(
        'Mensalidade — Leonardo Jacomini (06/2026)',
        'Leonardo Jacomini',
      ),
    ).toBe(true)
    expect(
      mensalidadeDescriptionMatchesBrother(
        'Mensalidade — João Silva (06/2026)',
        'Leonardo Jacomini',
      ),
    ).toBe(false)
  })
})
