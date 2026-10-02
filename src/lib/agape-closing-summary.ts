import type { AgapeBrotherCharge, AgapeMonthlyClosing } from '@/lib/data'

const CENT_TOLERANCE = 0.01

export interface AgapeClosingSummaryInput {
  charges: AgapeBrotherCharge[]
  closing: AgapeMonthlyClosing | null
  liveTotal: number | null
}

export interface AgapeClosingSummary {
  brothersTotal: number
  totalPaid: number
  totalPending: number
  totalBeverages: number
  remainingBalance: number
  paymentProgress: number
  pendingCount: number
  beveragesVsConsumptionMismatch: boolean
  isReadyToClose: boolean
  needsImport: boolean
  isClosed: boolean
  closeDisabledReason: string | null
}

function sumAmounts(charges: AgapeBrotherCharge[]): number {
  return charges.reduce((sum, charge) => sum + charge.amount, 0)
}

function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > CENT_TOLERANCE
}

/**
 * Consolida os números do fechamento mensal do ágape (saldo, progresso e
 * pendências) e decide se o mês pode ser encerrado. Mantida pura para que as
 * regras de encerramento sejam testáveis sem renderizar a tela.
 */
export function computeAgapeClosingSummary({
  charges,
  closing,
  liveTotal,
}: AgapeClosingSummaryInput): AgapeClosingSummary {
  const live = liveTotal ?? 0
  const paidCharges = charges.filter((c) => c.status === 'Pago')
  const pendingCharges = charges.filter((c) => c.status !== 'Pago')

  const brothersTotal = sumAmounts(charges)
  const totalPaid = sumAmounts(paidCharges)
  const totalPending = sumAmounts(pendingCharges)
  const totalBeverages = closing?.totalBeveragesSpent ?? 0
  const remainingBalance = Math.max(0, totalBeverages - totalPaid)
  const paymentProgress =
    totalBeverages > 0 ? Math.min(100, (totalPaid / totalBeverages) * 100) : 0
  const pendingCount = pendingCharges.length

  const beveragesVsConsumptionMismatch =
    totalBeverages > 0 && live > 0 && differs(live, totalBeverages)
  const brothersMatchBeverages =
    totalBeverages > 0 &&
    charges.length > 0 &&
    Math.abs(brothersTotal - totalBeverages) < CENT_TOLERANCE
  const allBrothersPaid = charges.length > 0 && pendingCount === 0
  const isReadyToClose =
    totalBeverages > 0 &&
    charges.length > 0 &&
    !beveragesVsConsumptionMismatch &&
    brothersMatchBeverages &&
    allBrothersPaid &&
    Math.abs(totalPaid - totalBeverages) < CENT_TOLERANCE
  const needsImport =
    live > 0 && (charges.length === 0 || differs(live, brothersTotal))
  const isClosed = closing?.status === 'closed'

  return {
    brothersTotal,
    totalPaid,
    totalPending,
    totalBeverages,
    remainingBalance,
    paymentProgress,
    pendingCount,
    beveragesVsConsumptionMismatch,
    isReadyToClose,
    needsImport,
    isClosed,
    closeDisabledReason: resolveCloseDisabledReason({
      isClosed,
      totalBeverages,
      chargesCount: charges.length,
      beveragesVsConsumptionMismatch,
      brothersMatchBeverages,
      pendingCount,
    }),
  }
}

function resolveCloseDisabledReason(state: {
  isClosed: boolean
  totalBeverages: number
  chargesCount: number
  beveragesVsConsumptionMismatch: boolean
  brothersMatchBeverages: boolean
  pendingCount: number
}): string | null {
  if (state.isClosed) return null
  if (state.totalBeverages <= 0) return 'Salve o total gasto em bebidas.'
  if (state.chargesCount === 0) return 'Importe os consumos ou registre cobranças.'
  if (state.beveragesVsConsumptionMismatch) {
    return 'O consumo no Ágape deve conferir com o total das bebidas.'
  }
  if (!state.brothersMatchBeverages) {
    return 'Importe novamente os consumos para alinhar a soma dos irmãos.'
  }
  if (state.pendingCount > 0) {
    return `${state.pendingCount} irmão(s) ainda não confirmou pagamento.`
  }
  return null
}
