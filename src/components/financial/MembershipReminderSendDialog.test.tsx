import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MembershipReminderSendDialog } from './MembershipReminderSendDialog'

const previewMock = vi.fn()
const sendMock = vi.fn()

vi.mock('@/lib/membership-reminder-settings', () => ({
  previewMembershipReminders: () => previewMock(),
  sendMembershipRemindersNow: () => sendMock(),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

function recipient(overrides: Record<string, unknown>) {
  return {
    brotherId: crypto.randomUUID(),
    brotherName: 'Irmão',
    email: 'irmao@mail.com',
    overdueLabels: ['Set/2026'],
    overdueAmount: 290,
    overdueCount: 1,
    alreadyRemindedThisMonth: false,
    ...overrides,
  }
}

describe('MembershipReminderSendDialog', () => {
  beforeEach(() => {
    previewMock.mockReset()
    sendMock.mockReset()
  })

  it('mostra a prévia e conta só quem realmente será avisado', async () => {
    previewMock.mockResolvedValue({
      ok: true,
      recipients: [
        recipient({ brotherName: 'Wanderson' }),
        recipient({ brotherName: 'Já Avisado', alreadyRemindedThisMonth: true }),
        recipient({ brotherName: 'Sem Email', email: null }),
      ],
    })

    render(
      <MembershipReminderSendDialog open onOpenChange={vi.fn()} onSent={vi.fn()} />,
    )

    expect(await screen.findByText('Wanderson')).toBeTruthy()
    expect(screen.getByText('Já avisado no mês')).toBeTruthy()
    expect(screen.getByText('Sem e-mail')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Enviar para 1 irmão/ })).toBeTruthy()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('só envia depois do clique de confirmação', async () => {
    previewMock.mockResolvedValue({ ok: true, recipients: [recipient({})] })
    sendMock.mockResolvedValue({ ok: true, message: '1 lembrete(s) enviado(s).' })
    const onSent = vi.fn()

    render(
      <MembershipReminderSendDialog open onOpenChange={vi.fn()} onSent={onSent} />,
    )

    fireEvent.click(await screen.findByRole('button', { name: /Enviar para 1 irmão/ }))
    await waitFor(() => expect(onSent).toHaveBeenCalled())
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('bloqueia o envio quando não há ninguém para avisar', async () => {
    previewMock.mockResolvedValue({ ok: true, recipients: [] })

    render(
      <MembershipReminderSendDialog open onOpenChange={vi.fn()} onSent={vi.fn()} />,
    )

    const button = await screen.findByRole('button', { name: 'Ninguém para avisar' })
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(true))
  })
})
