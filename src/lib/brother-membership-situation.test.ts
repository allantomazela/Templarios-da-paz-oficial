import { describe, expect, it } from 'vitest'
import {
  composeActiveMembershipAmount,
  inferMembershipSituation,
  resolveContributionAmountForSituation,
} from './brother-membership-situation'

describe('brother-membership-situation', () => {
  const settings = {
    baseAmount: 200,
    sessionPackageAmount: 90,
    defaultAmount: 290,
  }

  it('regular paga base + pacote', () => {
    expect(resolveContributionAmountForSituation('regular', settings)).toBe(290)
  })

  it('afastado paga só a base', () => {
    expect(resolveContributionAmountForSituation('afastado', settings)).toBe(200)
  })

  it('desligado não gera cobrança', () => {
    expect(resolveContributionAmountForSituation('desligado', settings)).toBeNull()
  })

  it('infere afastado pelo regularStatus legado', () => {
    expect(
      inferMembershipSituation({
        status: 'Ativo',
        regularStatus: 'Afastado',
      }),
    ).toBe('afastado')
  })

  it('infere desligado pelo status Inativo', () => {
    expect(
      inferMembershipSituation({
        status: 'Inativo',
        regularStatus: 'Regular',
      }),
    ).toBe('desligado')
  })

  it('compõe total ativo', () => {
    expect(composeActiveMembershipAmount(200, 90)).toBe(290)
  })
})
