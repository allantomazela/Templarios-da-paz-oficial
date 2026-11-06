import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Event } from '@/lib/data'
import { EventNotifications } from './EventNotifications'

const event: Event = {
  id: 'evt-1',
  title: 'Sessão Ordinária',
  date: '2026-11-05',
  time: '20:00',
  type: 'Sessão',
  location: 'Templo',
  description: 'Sessão da loja',
  attendees: 0,
}

describe('EventNotifications', () => {
  it('mostra o botão de envio em massa', () => {
    render(<EventNotifications event={event} />)

    expect(screen.getByText('Comunicação em Massa')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /Enviar para \d+ Irmãos/ }),
    ).toBeTruthy()
  })
})
