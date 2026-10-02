import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Table, TableBody } from '@/components/ui/table'
import type { Contribution } from '@/lib/data'
import type { MembershipScheduleEntry } from '@/lib/membership-schedule'
import type { MembershipScheduleRowState } from '@/lib/membership-schedule-rows'
import { MembershipScheduleRow } from './MembershipScheduleRow'

const openEntry: MembershipScheduleEntry = {
  month: 7,
  year: 2026,
  periodLabel: 'jul/2026',
  dueDate: '2026-07-10',
  expectedAmount: 290,
  paidAmount: 0,
  pendingAmount: 0,
  remainingAmount: 290,
  status: 'overdue',
  paymentsCount: 0,
}

const baseRow: MembershipScheduleRowState = {
  key: '2026-7',
  isHistorical: false,
  primaryContribution: undefined,
  selectable: true,
  badge: null,
  canControlOnlySettle: true,
}

function renderRow(
  overrides: Partial<Parameters<typeof MembershipScheduleRow>[0]> = {},
) {
  const props = {
    entry: openEntry,
    row: baseRow,
    checked: false,
    saving: false,
    onToggle: vi.fn(),
    onEditContribution: vi.fn(),
    onControlOnlySettle: vi.fn(),
    onLaunch: vi.fn(),
    ...overrides,
  }
  render(
    <Table>
      <TableBody>
        <MembershipScheduleRow {...props} />
      </TableBody>
    </Table>,
  )
  return props
}

describe('MembershipScheduleRow', () => {
  it('oferece lançar e quitar só no controle para mês em aberto', () => {
    const props = renderRow()
    fireEvent.click(screen.getByText('Lançar'))
    fireEvent.click(screen.getByText('Quitar (só controle)'))

    expect(props.onLaunch).toHaveBeenCalledWith(openEntry)
    expect(props.onControlOnlySettle).toHaveBeenCalledWith(openEntry)
    expect(screen.getByLabelText('Selecionar jul/2026')).toBeTruthy()
  })

  it('mostra editar quando o mês já tem lançamento', () => {
    const contribution: Contribution = {
      id: 'c1',
      brotherId: 'b1',
      month: 'Julho',
      year: 2026,
      amount: 290,
      status: 'Pago',
    }
    const props = renderRow({
      entry: { ...openEntry, status: 'paid', paidAmount: 290, remainingAmount: 0 },
      row: { ...baseRow, primaryContribution: contribution, selectable: false, badge: 'control_only' },
    })
    fireEvent.click(screen.getByText('Editar'))

    expect(props.onEditContribution).toHaveBeenCalledWith(contribution)
    expect(screen.getByText('Pago — somente controle')).toBeTruthy()
    expect(screen.queryByText('Lançar')).toBeNull()
    expect(screen.queryByLabelText('Selecionar jul/2026')).toBeNull()
  })
})
