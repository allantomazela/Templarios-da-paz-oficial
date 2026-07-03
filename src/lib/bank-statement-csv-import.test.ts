import { describe, expect, it } from 'vitest'
import {
  matchStatementLinesToTransactions,
  parseBankStatementCsv,
  parseBrazilianMoney,
} from '@/lib/bank-statement-csv-import'

describe('bank-statement-csv-import', () => {
  it('parseia valores brasileiros', () => {
    expect(parseBrazilianMoney('1.234,56')).toBe(1234.56)
    expect(parseBrazilianMoney('-290,00')).toBe(-290)
  })

  it('lê CSV com saldo final', () => {
    const csv = `Data;Descrição;Valor;Saldo
01/06/2026;PIX Mensalidade;290,00;3.084,50
02/06/2026;Taxa;-5,00;3.079,50`

    const parsed = parseBankStatementCsv(csv)
    expect(parsed.lines).toHaveLength(2)
    expect(parsed.closingBalance).toBe(3079.5)
    expect(parsed.lines[0].date).toBe('2026-06-01')
    expect(parsed.lines[0].amount).toBe(290)
  })

  it('cruza extrato com lançamentos do sistema', () => {
    const csv = `Data;Descrição;Valor;Saldo
01/06/2026;PIX;290,00;290,00`

    const parsed = parseBankStatementCsv(csv)
    const matches = matchStatementLinesToTransactions(
      parsed.lines,
      [
        {
          id: 'sys-1',
          date: '2026-06-01',
          amount: 290,
          type: 'Receita',
          accountId: 'acc-1',
        },
      ],
      'acc-1',
    )

    expect(matches[0].matched).toBe(true)
    expect(matches[0].transactionId).toBe('sys-1')
  })
})
