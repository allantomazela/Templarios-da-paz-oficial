import { describe, expect, it } from 'vitest'
import type { BankAccount, Transaction } from '@/lib/data'
import {
  accountHasFinancialMovement,
  findLowBalanceAccountsForAlert,
} from '@/lib/financial-low-balance-alerts'

const account = (id: string, name: string, initialBalance = 0): BankAccount => ({
  id,
  name,
  type: 'Corrente',
  initialBalance,
})

const transaction = (
  id: string,
  accountId: string,
  amount: number,
  type: Transaction['type'] = 'Despesa',
): Transaction => ({
  id,
  date: '2026-06-01',
  description: 'Teste',
  category: 'Geral',
  type,
  amount,
  accountId,
})

describe('findLowBalanceAccountsForAlert', () => {
  it('não alerta conta sem lançamentos, mesmo com saldo inicial zero', () => {
    const accounts = [account('iatu', 'Banco Iatú', 0)]
    const transactions: Transaction[] = []

    expect(findLowBalanceAccountsForAlert(accounts, transactions)).toEqual([])
  })

  it('não alerta conta recém-criada com saldo inicial abaixo do limite', () => {
    const accounts = [account('caixa', 'Caixa', 50)]
    const transactions: Transaction[] = []

    expect(findLowBalanceAccountsForAlert(accounts, transactions)).toEqual([])
  })

  it('alerta conta com movimentação e saldo abaixo do limite', () => {
    const accounts = [account('stone', 'Stone', 100)]
    const transactions = [transaction('1', 'stone', 80)]

    expect(findLowBalanceAccountsForAlert(accounts, transactions)).toEqual([
      accounts[0],
    ])
  })

  it('não alerta conta com movimentação e saldo acima do limite', () => {
    const accounts = [account('stone', 'Stone', 500)]
    const transactions = [transaction('1', 'stone', 50)]

    expect(findLowBalanceAccountsForAlert(accounts, transactions)).toEqual([])
  })

  it('ignora contas sem movimentação quando outra conta está baixa', () => {
    const accounts = [
      account('iatu', 'Banco Iatú', 0),
      account('stone', 'Stone', 100),
    ]
    const transactions = [transaction('1', 'stone', 80)]

    expect(findLowBalanceAccountsForAlert(accounts, transactions)).toEqual([
      accounts[1],
    ])
  })
})

describe('accountHasFinancialMovement', () => {
  it('retorna false sem lançamentos na conta', () => {
    expect(accountHasFinancialMovement('iatu', [])).toBe(false)
  })

  it('retorna true quando há lançamento vinculado', () => {
    expect(
      accountHasFinancialMovement('iatu', [transaction('1', 'iatu', 10)]),
    ).toBe(true)
  })
})
