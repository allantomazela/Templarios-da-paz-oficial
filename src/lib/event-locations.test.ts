import { describe, expect, it } from 'vitest'
import type { Location } from '@/lib/data'
import { resolvePrintedEventLocation } from '@/lib/event-locations'

const siteTitle = 'Templários da Paz 3969'
const contact = { city: 'Botucatu - SP', address: 'Rua Joaquim Marins, 565' }
const locations = [{ id: 'loc-1', name: 'Loja Irmã — Templo Norte' }] as Location[]
const lodgeEvent = { location: 'Templários da Paz 3969 — Botucatu - SP' }

describe('resolvePrintedEventLocation', () => {
  it('sessão no templo da loja sai como Templo das Espadas por padrão', () => {
    expect(resolvePrintedEventLocation(lodgeEvent, locations, siteTitle, contact)).toBe(
      'Templo das Espadas',
    )
  })

  it('usa o nome do templo configurado e ignora valor vazio', () => {
    expect(
      resolvePrintedEventLocation(lodgeEvent, locations, siteTitle, contact, 'Templo Novo'),
    ).toBe('Templo Novo')
    expect(resolvePrintedEventLocation(lodgeEvent, locations, siteTitle, contact, '  ')).toBe(
      'Templo das Espadas',
    )
  })

  it('local cadastrado e local digitado mantêm o nome', () => {
    expect(
      resolvePrintedEventLocation({ locationId: 'loc-1' }, locations, siteTitle, contact),
    ).toBe('Loja Irmã — Templo Norte')
    expect(
      resolvePrintedEventLocation({ location: 'Salão Social' }, locations, siteTitle, contact),
    ).toBe('Salão Social')
  })
})
