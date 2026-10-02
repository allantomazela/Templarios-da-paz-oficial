import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { AgapeBrotherCharge } from '@/lib/data'
import { AgapeChargesTable } from './AgapeChargesTable'

const paidLinked: AgapeBrotherCharge = {
  id: 'a1',
  brotherId: 'b1',
  month: 9,
  year: 2026,
  consumedAmount: 45,
  amount: 45,
  status: 'Pago',
  paymentDate: '2026-09-20',
  transactionId: 'tx-1',
}

const pending: AgapeBrotherCharge = {
  id: 'a2',
  brotherId: 'b2',
  brotherName: 'Irmão Sem Mapa',
  month: 9,
  year: 2026,
  consumedAmount: 30,
  amount: 30,
  status: 'Pendente',
}

function renderTable(overrides: Partial<Parameters<typeof AgapeChargesTable>[0]> = {}) {
  const props = {
    charges: [paidLinked, pending],
    brotherNames: { b1: 'Irmão Mapeado' },
    monthLabel: 'setembro 2026',
    canEdit: true,
    isDeleting: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<AgapeChargesTable {...props} />)
  return props
}

describe('AgapeChargesTable', () => {
  it('mostra mensagem quando não há cobranças no mês', () => {
    renderTable({ charges: [] })
    expect(screen.getByText(/Nenhuma cobrança para setembro 2026/)).toBeTruthy()
  })

  it('usa o nome mapeado e cai para o nome da cobrança', () => {
    renderTable()
    expect(screen.getByText('Irmão Mapeado')).toBeTruthy()
    expect(screen.getByText('Irmão Sem Mapa')).toBeTruthy()
    expect(screen.getByText('Receita lançada')).toBeTruthy()
  })

  it('aciona editar e excluir com a cobrança da linha', () => {
    const props = renderTable()
    fireEvent.click(screen.getAllByTitle('Editar lançamento')[1])
    fireEvent.click(screen.getAllByTitle('Excluir lançamento')[0])

    expect(props.onEdit).toHaveBeenCalledWith(pending)
    expect(props.onDelete).toHaveBeenCalledWith(paidLinked)
  })

  it('oculta as ações quando o mês não pode ser editado', () => {
    renderTable({ canEdit: false })
    expect(screen.queryByText('Ações')).toBeNull()
    expect(screen.queryByTitle('Editar lançamento')).toBeNull()
  })
})
