import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Event, VisitorAttendance } from '@/lib/data'
import { VisitorCertificateDocument } from './VisitorCertificateDocument'

vi.mock('@/stores/useSiteSettingsStore', () => ({
  default: () => ({
    logoUrl: '',
    siteTitle: 'Templários da Paz',
    contact: { address: 'Rua da Loja', city: 'São Paulo' },
  }),
}))

const visitor: VisitorAttendance = {
  id: 'v1',
  sessionRecordId: 's1',
  name: 'João Visitante',
  degree: 'Mestre',
  lodge: 'Acácia',
  lodgeNumber: '10',
  obedience: 'GOB',
  masonicNumber: '123',
}

const event: Event = {
  id: 'e1',
  title: 'Sessão Ordinária',
  date: '2026-10-29',
  time: '20:00',
  type: 'Sessão',
  location: 'Templo',
  description: 'Sessão',
  attendees: 0,
}

describe('VisitorCertificateDocument', () => {
  it('mantém o nome do visitante no certificado preenchido', () => {
    render(
      <VisitorCertificateDocument
        visitor={visitor}
        event={event}
        venerableMaster="Mestre Instalado"
        chancellor="Chanceler da Loja"
      />,
    )
    expect(screen.getByText('João Visitante')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Certificado de Presença' }).className).toContain(
      'certificate-title',
    )
    expect(screen.queryByText('Formulário para preenchimento à mão')).toBeNull()
  })

  it('mostra linhas em branco sem exigir os dados do visitante', () => {
    render(
      <VisitorCertificateDocument
        blank
        venerableMaster="Mestre Instalado"
        chancellor="Chanceler da Loja"
      />,
    )
    expect(screen.getByText('Formulário para preenchimento à mão')).toBeTruthy()
    expect(screen.queryByText('João Visitante')).toBeNull()
    expect(screen.getByText(/Certificamos que o Ir/)).toBeTruthy()
  })
})
