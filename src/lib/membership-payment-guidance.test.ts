import { describe, expect, it } from 'vitest'
import {
  getMembershipLaunchGuidance,
  requiresMembershipEscalation,
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
