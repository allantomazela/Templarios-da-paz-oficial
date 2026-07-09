import { describe, expect, it } from 'vitest'
import {
  buildExtratoStateMap,
  mapAccountReconciliationExtratoRow,
} from '@/lib/account-reconciliation-extrato-api'

describe('account-reconciliation-extrato-api', () => {
  it('mapeia linha do banco', () => {
    const mapped = mapAccountReconciliationExtratoRow({
      account_id: 'acc-1',
      extrato_balance: 15290,
      note: 'Pagamento Ednilson ainda não lançado',
      updated_at: '2026-07-09T18:00:00Z',
      updated_by: 'user-1',
    })

    expect(mapped).toEqual({
      accountId: 'acc-1',
      extratoBalance: 15290,
      note: 'Pagamento Ednilson ainda não lançado',
      updatedAt: '2026-07-09T18:00:00Z',
      updatedBy: 'user-1',
    })
  })

  it('monta mapa de estado para a UI', () => {
    const map = buildExtratoStateMap([
      {
        accountId: 'stone',
        extratoBalance: 290,
        note: 'Divergência explicada',
        updatedAt: '2026-07-09T18:00:00Z',
        updatedBy: null,
      },
      {
        accountId: 'itau',
        extratoBalance: null,
        note: null,
        updatedAt: '2026-07-09T18:00:00Z',
        updatedBy: null,
      },
    ])

    expect(map).toEqual({
      stone: { balance: '290', note: 'Divergência explicada' },
      itau: { balance: '', note: '' },
    })
  })
})
