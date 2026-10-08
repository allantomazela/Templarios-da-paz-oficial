import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}))

import { saveBrotherDegreeInfo } from '@/lib/chancellor-degree-api'

describe('saveBrotherDegreeInfo', () => {
  beforeEach(() => rpcMock.mockReset())

  it('envia datas vazias como nulas e mantém a iniciação atual', async () => {
    rpcMock.mockResolvedValue({ error: null })
    const saved = await saveBrotherDegreeInfo('b1', {
      degree: 'Companheiro',
      initiationDate: '',
      elevationDate: '2026-05-01',
      exaltationDate: '',
    })
    expect(rpcMock).toHaveBeenCalledWith('update_brother_degree_info', {
      p_brother_id: 'b1',
      p_degree: 'Companheiro',
      p_initiation_date: null,
      p_elevation_date: '2026-05-01',
      p_exaltation_date: null,
    })
    expect(saved).toEqual({
      degree: 'Companheiro',
      elevationDate: '2026-05-01',
      exaltationDate: undefined,
    })
  })

  it('repassa a mensagem de erro do banco', async () => {
    rpcMock.mockResolvedValue({ error: { message: 'Sem permissão para alterar o grau dos irmãos.' } })
    await expect(
      saveBrotherDegreeInfo('b1', {
        degree: 'Mestre',
        initiationDate: '2020-01-01',
        elevationDate: '',
        exaltationDate: '',
      }),
    ).rejects.toThrow('Sem permissão para alterar o grau dos irmãos.')
  })
})
