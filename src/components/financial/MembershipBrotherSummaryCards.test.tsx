import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { BrotherContributionSummary } from '@/lib/contribution-payments'
import { MembershipBrotherSummaryCards } from './MembershipBrotherSummaryCards'

const summary: BrotherContributionSummary = {
  brotherId: 'b1',
  brotherName: 'João Silva',
  currentStatus: 'overdue',
  totalPaid: 580,
  totalPending: 290,
  paidCount: 2,
  pendingCount: 0,
  overdueCount: 1,
  lastPaymentDate: '2026-06-05',
}

describe('MembershipBrotherSummaryCards', () => {
  it('mostra situação, pendências e meses em atraso do irmão', () => {
    render(
      <MembershipBrotherSummaryCards
        summary={summary}
        schedule={null}
        treasuryPaidTotal={290}
      />,
    )

    expect(screen.getAllByText('Em atraso')).toHaveLength(2)
    expect(screen.getByText('1 em aberto')).toBeTruthy()
    expect(screen.getByText('0 mês(es)')).toBeTruthy()
    expect(screen.getByText('05/06/2026')).toBeTruthy()
  })
})
