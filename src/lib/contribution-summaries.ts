import type { Contribution } from '@/lib/data'
import { monthNameToNumber } from '@/lib/contribution-months'

export interface BrotherContributionSummary {
  brotherId: string
  brotherName: string
  totalPaid: number
  totalPending: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  currentStatus: 'paid' | 'pending' | 'upcoming' | 'overdue' | 'none'
  lastPaymentDate: string | null
}

function resolveCurrentStatus(
  items: Contribution[],
  currentMonth: number,
  currentYear: number,
): BrotherContributionSummary['currentStatus'] {
  const currentMonthItems = items.filter(
    (i) => monthNameToNumber(i.month) === currentMonth && i.year === currentYear,
  )
  if (currentMonthItems.length === 0) return 'none'

  const hasUnpaid = currentMonthItems.some((i) => i.status !== 'Pago')
  if (!hasUnpaid) return 'paid'
  // Só fica em atraso se marcado manualmente; o mês corrente ainda está aberto.
  if (currentMonthItems.some((i) => i.status === 'Atrasado')) return 'overdue'
  return 'upcoming'
}

function findLastPayment(paid: Contribution[]): Contribution | undefined {
  return paid.slice().sort((a, b) => {
    const da = a.paymentDate || `${a.year}-${monthNameToNumber(a.month)}`
    const db = b.paymentDate || `${b.year}-${monthNameToNumber(b.month)}`
    return db.localeCompare(da)
  })[0]
}

export function buildBrotherSummaries(
  contributions: Contribution[],
  brotherNames: Record<string, string>,
  approvedBrothers: { id: string; full_name: string | null }[],
): BrotherContributionSummary[] {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const byBrother = new Map<string, Contribution[]>()
  for (const c of contributions) {
    const list = byBrother.get(c.brotherId) ?? []
    list.push(c)
    byBrother.set(c.brotherId, list)
  }

  const brotherIds = new Set([
    ...approvedBrothers.map((b) => b.id),
    ...contributions.map((c) => c.brotherId),
  ])

  return [...brotherIds]
    .map((brotherId) => {
      const items = byBrother.get(brotherId) ?? []
      const brotherName =
        brotherNames[brotherId] ||
        approvedBrothers.find((b) => b.id === brotherId)?.full_name ||
        'Sem nome'

      const paid = items.filter((i) => i.status === 'Pago')
      const pending = items.filter((i) => i.status !== 'Pago')

      return {
        brotherId,
        brotherName,
        totalPaid: paid.reduce((s, i) => s + i.amount, 0),
        totalPending: pending.reduce((s, i) => s + i.amount, 0),
        paidCount: paid.length,
        pendingCount: pending.filter((i) => i.status === 'Pendente').length,
        overdueCount: pending.filter((i) => i.status === 'Atrasado').length,
        currentStatus: resolveCurrentStatus(items, currentMonth, currentYear),
        lastPaymentDate: findLastPayment(paid)?.paymentDate ?? null,
      }
    })
    .sort((a, b) => a.brotherName.localeCompare(b.brotherName, 'pt-BR'))
}
