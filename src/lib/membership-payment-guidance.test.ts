import { describe, expect, it } from 'vitest'
import {
  getMembershipLaunchGuidance,
  requiresMembershipEscalation,
  resolveContributionDialogGuidance,
  splitOverdueAlertsByEscalation,
} from '@/lib/membership-payment-guidance'

describe('membership-payment-guidance', () => {
  it('orienta pagamento individual de um mês', () => {
    const guidance = getMembershipLaunchGuidance({
      openMonthsCount: 1,
      isSingleMonthLaunch: true,
    })
    expect(guidance?.suggestBatchSettlement).toBe(false)
    expect(guidance?.message).toContain('jul/2026')
  })

  it('sugere quitação em lote quando há outros meses em aberto', () => {
    const guidance = getMembershipLaunchGuidance({
      openMonthsCount: 3,
      isSingleMonthLaunch: true,
    })
    expect(guidance?.suggestBatchSettlement).toBe(true)
    expect(guidance?.variant).toBe('warning')
  })

  it('identifica escalonamento a partir de 3 meses', () => {
    expect(requiresMembershipEscalation(2)).toBe(false)
    expect(requiresMembershipEscalation(3)).toBe(true)
  })

  it('separa alertas de escalonamento', () => {
    const alerts = [
      { brotherId: '1', overdueCount: 1 },
      { brotherId: '2', overdueCount: 3 },
    ]
    const { escalation, regular } = splitOverdueAlertsByEscalation(alerts)
    expect(escalation).toHaveLength(1)
    expect(regular).toHaveLength(1)
  })
})

describe('resolveContributionDialogGuidance', () => {
  it('não orienta na edição', () => {
    expect(
      resolveContributionDialogGuidance({
        isEditing: true,
        isSingleMonthLaunch: true,
        openMonthsCount: 3,
      }),
    ).toBeNull()
  })

  it('lançamento de um mês sem outros em aberto usa a orientação individual', () => {
    const guidance = resolveContributionDialogGuidance({
      isEditing: false,
      isSingleMonthLaunch: true,
      openMonthsCount: 0,
    })
    expect(guidance?.title).toBe('Pagamento de um mês')
  })

  it('lançamento livre com vários meses sugere quitação em lote', () => {
    const guidance = resolveContributionDialogGuidance({
      isEditing: false,
      isSingleMonthLaunch: false,
      openMonthsCount: 2,
    })
    expect(guidance?.title).toBe('Vários meses em aberto')
    expect(guidance?.suggestBatchSettlement).toBe(true)
  })

  it('lançamento livre com até um mês em aberto não orienta', () => {
    expect(
      resolveContributionDialogGuidance({
        isEditing: false,
        isSingleMonthLaunch: false,
        openMonthsCount: 1,
      }),
    ).toBeNull()
  })
})
