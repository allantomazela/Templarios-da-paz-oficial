import { describe, expect, it } from 'vitest'
import type { Contribution } from '@/lib/data'
import {
  buildContributionFormValues,
  contributionMonthNameToNumber,
  contributionSchema,
} from '@/lib/contribution-form-schema'

const NOW = new Date(2026, 9, 2, 8, 0, 0)

function validPayment(overrides: Record<string, unknown> = {}) {
  return {
    brotherId: 'b1',
    month: 'Setembro',
    year: 2026,
    amount: 290,
    status: 'Pago',
    paymentDate: '2026-09-10',
    accountId: 'acc-1',
    notes: '',
    treasuryMode: 'standard',
    linkedTransactionId: '',
    ...overrides,
  }
}

describe('contributionMonthNameToNumber', () => {
  it('converte nome do mês em número', () => {
    expect(contributionMonthNameToNumber('Janeiro')).toBe(1)
    expect(contributionMonthNameToNumber('Setembro')).toBe(9)
    expect(contributionMonthNameToNumber('Inexistente')).toBe(0)
  })
})

describe('contributionSchema', () => {
  it('aceita pagamento com conta e converte texto numérico', () => {
    const parsed = contributionSchema.safeParse(
      validPayment({ amount: '290.00', year: '2026' }),
    )
    expect(parsed.success).toBe(true)
    expect(parsed.data?.amount).toBe(290)
    expect(parsed.data?.year).toBe(2026)
  })

  it('exige conta bancária no pagamento padrão', () => {
    const parsed = contributionSchema.safeParse(validPayment({ accountId: '' }))
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.path).toEqual(['accountId'])
  })

  it('exige receita ao vincular em período de produção', () => {
    const parsed = contributionSchema.safeParse(
      validPayment({ treasuryMode: 'link_existing', accountId: '' }),
    )
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.path).toEqual(['linkedTransactionId'])
  })

  it('não exige conta para pendente nem para só controle', () => {
    expect(
      contributionSchema.safeParse(validPayment({ status: 'Pendente', accountId: '' }))
        .success,
    ).toBe(true)
    expect(
      contributionSchema.safeParse(
        validPayment({ treasuryMode: 'control_only', accountId: '' }),
      ).success,
    ).toBe(true)
  })

  it('rejeita valor zerado', () => {
    expect(contributionSchema.safeParse(validPayment({ amount: 0 })).success).toBe(false)
  })
})

describe('buildContributionFormValues', () => {
  it('lançamento novo usa os padrões da tela', () => {
    const values = buildContributionFormValues(
      null,
      { brotherId: 'b1', month: 'Agosto', year: 2026, amount: 290, treasuryMode: 'control_only' },
      NOW,
    )
    expect(values).toMatchObject({
      brotherId: 'b1',
      month: 'Agosto',
      year: 2026,
      amount: 290,
      status: 'Pago',
      paymentDate: '2026-10-02',
      accountId: '',
      treasuryMode: 'control_only',
    })
  })

  it('lançamento novo sem mês usa o mês e ano atuais', () => {
    const values = buildContributionFormValues(
      null,
      { amount: 150, treasuryMode: 'standard' },
      NOW,
    )
    expect(values.month).toBe('Outubro')
    expect(values.year).toBe(2026)
    expect(values.brotherId).toBe('')
  })

  it('edição carrega o lançamento existente', () => {
    const contribution = {
      id: 'c1',
      brotherId: 'b2',
      brotherName: 'Tiago',
      month: 'Setembro',
      year: 2026,
      amount: 290,
      status: 'Pago',
      paymentDate: '2026-09-10',
      accountId: 'acc-1',
      transactionId: 'tx-1',
      notes: 'Forma de pagamento: PIX',
    } as unknown as Contribution

    const values = buildContributionFormValues(
      contribution,
      { amount: 150, treasuryMode: 'standard' },
      NOW,
    )
    expect(values).toMatchObject({
      brotherId: 'b2',
      month: 'Setembro',
      amount: 290,
      paymentDate: '2026-09-10',
      accountId: 'acc-1',
      linkedTransactionId: 'tx-1',
      notes: 'Forma de pagamento: PIX',
    })
  })
})
