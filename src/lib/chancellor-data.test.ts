import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.fn()
const orderMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => ({ select: () => ({ order: (...args: unknown[]) => orderMock(...args) }) }),
  },
}))

import {
  eventToDbPayload,
  fetchChancellorBrothers,
  mapEventFromDB,
} from '@/lib/chancellor-data'
import type { Event } from '@/lib/data'

const baseEvent: Event = {
  id: 'e1',
  title: 'Sessão',
  date: '2026-10-15',
  time: '20:00',
  type: 'Sessão',
  location: 'Templo',
  description: '',
  attendees: 0,
}

describe('grau da sessão no evento', () => {
  it('lê o grau quando a coluna vem na consulta', () => {
    expect(mapEventFromDB({ id: 'e1', degree: 'Mestre' }).degree).toBe('Mestre')
    expect(mapEventFromDB({ id: 'e1', degree: null }).degree).toBeNull()
  })

  it('não define o grau quando a coluna não veio, para não apagá-lo ao salvar', () => {
    expect(mapEventFromDB({ id: 'e1' }).degree).toBeUndefined()
  })

  it('só envia o grau ao banco quando foi informado explicitamente', () => {
    expect('degree' in eventToDbPayload(baseEvent)).toBe(false)
    expect(eventToDbPayload({ ...baseEvent, degree: null }).degree).toBeNull()
    expect(eventToDbPayload({ ...baseEvent, degree: 'Companheiro' }).degree).toBe('Companheiro')
  })
})

describe('fetchChancellorBrothers', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    orderMock.mockReset()
  })

  it('usa a função segura do banco', async () => {
    rpcMock.mockResolvedValue({
      data: [{ id: 'b1', name: 'Irmão', degree: 'Mestre', status: 'Ativo', cim: '9' }],
      error: null,
    })
    const brothers = await fetchChancellorBrothers()
    expect(rpcMock).toHaveBeenCalledWith('get_chancellor_brothers')
    expect(brothers[0].name).toBe('Irmão')
    expect(orderMock).not.toHaveBeenCalled()
  })

  it('cai na leitura direta quando a função ainda não existe', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: '' } })
    orderMock.mockResolvedValue({ data: [{ id: 'b2', name: 'Outro' }], error: null })
    const brothers = await fetchChancellorBrothers()
    expect(brothers.map((b) => b.id)).toEqual(['b2'])
  })

  it('propaga outros erros', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: '42501', message: 'negado' } })
    await expect(fetchChancellorBrothers()).rejects.toBeTruthy()
  })
})
