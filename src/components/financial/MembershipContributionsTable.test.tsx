import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Contribution } from '@/lib/data'
import { MembershipContributionsTable } from './MembershipContributionsTable'
import { MembershipAllContributionsTab } from './MembershipAllContributionsTab'

const linked: Contribution = {
  id: 'c1',
  brotherId: 'b1',
  month: 'Junho',
  year: 2026,
  amount: 290,
  status: 'Pago',
  paymentDate: '2026-06-05',
  transactionId: 'tx-1',
}

const historical: Contribution = {
  id: 'c2',
  brotherId: 'b2',
  month: 'Março',
  year: 2026,
  amount: 290,
  status: 'Pago',
  paymentDate: '2026-03-05',
}

const pending: Contribution = {
  id: 'c3',
  brotherId: 'b1',
  month: 'Julho',
  year: 2026,
  amount: 290,
  status: 'Pendente',
}

const brotherNames = { b1: 'João Silva', b2: 'Pedro Souza' }

describe('MembershipContributionsTable', () => {
  it('mostra o vínculo com a tesouraria de cada lançamento', () => {
    render(
      <MembershipContributionsTable
        rows={[linked, historical, pending]}
        brotherNames={brotherNames}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        emptyMessage="Vazio"
      />,
    )

    expect(screen.getByText('Receita lançada')).toBeTruthy()
    expect(screen.getByText('Só controle')).toBeTruthy()
    expect(screen.getByText('Pendente')).toBeTruthy()
    expect(screen.getByText('Pedro Souza')).toBeTruthy()
  })

  it('aciona editar e excluir com o lançamento da linha', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <MembershipContributionsTable
        rows={[linked]}
        brotherNames={brotherNames}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage="Vazio"
      />,
    )

    const [editButton, deleteButton] = screen.getAllByRole('button')
    fireEvent.click(editButton)
    fireEvent.click(deleteButton)
    expect(onEdit).toHaveBeenCalledWith(linked)
    expect(onDelete).toHaveBeenCalledWith(linked)
  })

  it('exibe a mensagem quando não há lançamentos', () => {
    render(
      <MembershipContributionsTable
        rows={[]}
        brotherNames={brotherNames}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        emptyMessage="Nenhuma mensalidade encontrada."
      />,
    )

    expect(screen.getByText('Nenhuma mensalidade encontrada.')).toBeTruthy()
  })
})

describe('MembershipAllContributionsTab', () => {
  it('filtra os lançamentos pelo nome do irmão', () => {
    render(
      <MembershipAllContributionsTab
        contributions={[linked, historical]}
        brotherNames={brotherNames}
        searchTerm="pedro"
        onSearchTermChange={vi.fn()}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('Pedro Souza')).toBeTruthy()
    expect(screen.queryByText('João Silva')).toBeNull()
  })
})
