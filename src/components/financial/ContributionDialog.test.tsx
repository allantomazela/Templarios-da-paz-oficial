import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Contribution } from '@/lib/data'
import { ContributionDialog } from './ContributionDialog'

vi.mock('@/lib/contribution-payments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/contribution-payments')>()
  return {
    ...actual,
    fetchApprovedBrothers: vi.fn(async () => []),
    fetchBankAccounts: vi.fn(async () => [{ id: 'acc-1', name: 'Banco Itaú' }]),
    fetchLinkableMensalidadeTransactions: vi.fn(async () => []),
  }
})

const FEE_SETTINGS = {
  defaultAmount: 290,
  dueDay: 10,
  baseAmount: 200,
  sessionPackageAmount: 90,
}

const BROTHERS = [{ id: 'b1', full_name: 'Tiago Zonta' }]

const CONTRIBUTION = {
  id: 'c1',
  brotherId: 'b1',
  brotherName: 'Tiago Zonta',
  month: 'Setembro',
  year: 2026,
  amount: 290,
  status: 'Pago',
  paymentDate: '2026-09-10',
  accountId: 'acc-1',
  transactionId: 'tx-1',
  notes: 'Forma de pagamento: PIX',
} as unknown as Contribution

function renderEditDialog(onSave = vi.fn()) {
  render(
    <ContributionDialog
      open
      onOpenChange={vi.fn()}
      contributionToEdit={CONTRIBUTION}
      brothers={BROTHERS}
      feeSettings={FEE_SETTINGS}
      defaultAmount={290}
      onSave={onSave}
    />,
  )
  return onSave
}

async function waitForFormReady() {
  const amountInput = (await screen.findByLabelText('Valor (R$)')) as HTMLInputElement
  await waitFor(() => expect(amountInput.value).toBe('290'))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Salvar' })).not.toHaveProperty('disabled', true),
  )
  return amountInput
}

describe('ContributionDialog (lançamento novo)', () => {
  it('orienta o lançamento do mês e exige conta bancária para Pago', async () => {
    const onSave = vi.fn()
    render(
      <ContributionDialog
        open
        onOpenChange={vi.fn()}
        contributionToEdit={null}
        defaultBrotherId="b1"
        defaultBrotherName="Tiago Zonta"
        defaultMonth="Setembro"
        defaultYear={2026}
        defaultAmount={290}
        brothers={BROTHERS}
        launchFromSchedule
        openMonthsCount={1}
        onSave={onSave}
      />,
    )

    await waitForFormReady()
    expect(screen.getByText('Pagamento de um mês')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('Conta bancária é obrigatória para pagamento confirmado'),
    ).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('ContributionDialog (edição)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carrega o lançamento e salva sem confirmação quando o valor não muda', async () => {
    const onSave = renderEditDialog()
    await waitForFormReady()

    expect(screen.getAllByText('Editar mensalidade').length).toBeGreaterThan(0)
    expect((screen.getByLabelText('Data do pagamento') as HTMLInputElement).value).toBe(
      '2026-09-10',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0][0]).toMatchObject({
      brotherId: 'b1',
      brotherName: 'Tiago Zonta',
      month: 'Setembro',
      year: 2026,
      amount: 290,
      status: 'Pago',
      accountId: 'acc-1',
      treasuryMode: 'standard',
      notes: 'Forma de pagamento: PIX',
    })
    expect(screen.queryByText('Reduzir o valor desta mensalidade?')).toBeNull()
  })

  it('pede confirmação ao trocar a mensalidade pelo valor do lanche', async () => {
    const onSave = renderEditDialog()
    const amountInput = await waitForFormReady()

    fireEvent.change(amountInput, { target: { value: '21' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Reduzir o valor desta mensalidade?')).toBeTruthy()
    expect(onSave).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Reduzir mesmo assim' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0][0]).toMatchObject({ amount: 21, month: 'Setembro' })
  })

  it('não salva ao escolher voltar e corrigir', async () => {
    const onSave = renderEditDialog()
    const amountInput = await waitForFormReady()

    fireEvent.change(amountInput, { target: { value: '21' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Voltar e corrigir' }))

    await waitFor(() =>
      expect(screen.queryByText('Reduzir o valor desta mensalidade?')).toBeNull(),
    )
    expect(onSave).not.toHaveBeenCalled()
  })
})
