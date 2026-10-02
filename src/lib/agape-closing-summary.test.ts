import { describe, expect, it } from 'vitest'
import type { AgapeBrotherCharge, AgapeMonthlyClosing } from '@/lib/data'
import { computeAgapeClosingSummary } from './agape-closing-summary'

function charge(
  amount: number,
  status: AgapeBrotherCharge['status'],
  id = `c-${amount}-${status}`,
): AgapeBrotherCharge {
  return {
    id,
    brotherId: `b-${id}`,
    month: 9,
    year: 2026,
    consumedAmount: amount,
    amount,
    status,
  }
}

function closing(
  totalBeveragesSpent: number | undefined,
  status: AgapeMonthlyClosing['status'] = 'open',
): AgapeMonthlyClosing {
  return {
    id: 'closing-1',
    month: 9,
    year: 2026,
    totalConsumed: 0,
    totalBeveragesSpent,
    totalPaid: 0,
    status,
  }
}

describe('computeAgapeClosingSummary', () => {
  it('pede o total das bebidas quando o mês está vazio', () => {
    const summary = computeAgapeClosingSummary({
      charges: [],
      closing: null,
      liveTotal: 0,
    })

    expect(summary.totalBeverages).toBe(0)
    expect(summary.paymentProgress).toBe(0)
    expect(summary.isReadyToClose).toBe(false)
    expect(summary.needsImport).toBe(false)
    expect(summary.closeDisabledReason).toBe('Salve o total gasto em bebidas.')
  })

  it('calcula saldo, progresso e pendências com pagamentos parciais', () => {
    const summary = computeAgapeClosingSummary({
      charges: [charge(60, 'Pago'), charge(40, 'Pendente')],
      closing: closing(100),
      liveTotal: 100,
    })

    expect(summary.brothersTotal).toBe(100)
    expect(summary.totalPaid).toBe(60)
    expect(summary.totalPending).toBe(40)
    expect(summary.remainingBalance).toBe(40)
    expect(summary.paymentProgress).toBe(60)
    expect(summary.pendingCount).toBe(1)
    expect(summary.isReadyToClose).toBe(false)
    expect(summary.closeDisabledReason).toBe(
      '1 irmão(s) ainda não confirmou pagamento.',
    )
  })

  it('libera o encerramento quando tudo confere e foi pago', () => {
    const summary = computeAgapeClosingSummary({
      charges: [charge(60, 'Pago'), charge(40, 'Pago')],
      closing: closing(100),
      liveTotal: 100,
    })

    expect(summary.isReadyToClose).toBe(true)
    expect(summary.remainingBalance).toBe(0)
    expect(summary.closeDisabledReason).toBeNull()
  })

  it('aponta divergência entre consumo do Ágape e total das bebidas', () => {
    const summary = computeAgapeClosingSummary({
      charges: [charge(100, 'Pago')],
      closing: closing(100),
      liveTotal: 120,
    })

    expect(summary.beveragesVsConsumptionMismatch).toBe(true)
    expect(summary.needsImport).toBe(true)
    expect(summary.isReadyToClose).toBe(false)
    expect(summary.closeDisabledReason).toBe(
      'O consumo no Ágape deve conferir com o total das bebidas.',
    )
  })

  it('pede nova importação quando a soma dos irmãos não bate com as bebidas', () => {
    const summary = computeAgapeClosingSummary({
      charges: [charge(80, 'Pago')],
      closing: closing(100),
      liveTotal: 0,
    })

    expect(summary.closeDisabledReason).toBe(
      'Importe novamente os consumos para alinhar a soma dos irmãos.',
    )
  })

  it('não mostra motivo de bloqueio quando o mês já está encerrado', () => {
    const summary = computeAgapeClosingSummary({
      charges: [charge(100, 'Pendente')],
      closing: closing(100, 'closed'),
      liveTotal: 100,
    })

    expect(summary.isClosed).toBe(true)
    expect(summary.closeDisabledReason).toBeNull()
  })
})
