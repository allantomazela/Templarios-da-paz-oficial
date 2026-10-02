import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ContributionAmountReductionConfirm } from './ContributionAmountReductionConfirm'

const reduction = { previousAmount: 290, newAmount: 21, missingAmount: 269 }

describe('ContributionAmountReductionConfirm', () => {
  it('explica que o mês volta a ficar em aberto e confirma a redução', () => {
    const onConfirm = vi.fn()
    render(
      <ContributionAmountReductionConfirm
        reduction={reduction}
        periodText="Setembro/2026"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText('Setembro/2026')).toBeTruthy()
    expect(screen.getByText(/Vendas do Templo/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Reduzir mesmo assim' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('volta sem salvar ao escolher corrigir', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ContributionAmountReductionConfirm
        reduction={reduction}
        periodText="Setembro/2026"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Voltar e corrigir' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('não aparece sem redução pendente', () => {
    render(
      <ContributionAmountReductionConfirm
        reduction={null}
        periodText=""
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.queryByText('Reduzir o valor desta mensalidade?')).toBeNull()
  })
})
