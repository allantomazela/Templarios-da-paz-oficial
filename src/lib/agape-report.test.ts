import { describe, expect, it } from 'vitest'
import { buildAgapeReportData } from '@/lib/agape-report'
import type { AgapeConsumption, AgapeSession } from '@/stores/useAgapeStore'

const sessions: AgapeSession[] = [
  {
    id: 'session-1',
    date: '2026-07-10',
    description: 'Ágape de julho',
    status: 'open',
    source: 'manual',
    event_id: null,
    created_by: null,
    created_at: '2026-07-10T00:00:00Z',
    updated_at: '2026-07-10T00:00:00Z',
  },
]

const consumptions: AgapeConsumption[] = [
  {
    id: 'c1',
    session_id: 'session-1',
    brother_id: 'brother-1',
    menu_item_id: 'item-1',
    quantity: 2,
    unit_price: 15,
    total_amount: 30,
    notes: null,
    recorded_by: 'user-1',
    created_at: '2026-07-10T00:00:00Z',
    updated_at: '2026-07-10T00:00:00Z',
    brother: { id: 'brother-1', full_name: 'Irmão A' },
    menu_item: { id: 'item-1', name: 'Refrigerante', price: 15 },
    recorded_by_profile: { id: 'user-1', full_name: 'Tesoureiro' },
  },
]

describe('buildAgapeReportData', () => {
  it('monta consumo itemizado por irmão', () => {
    const report = buildAgapeReportData(sessions, consumptions, sessions)

    expect(report).toHaveLength(1)
    expect(report[0]).toMatchObject({
      brotherName: 'Irmão A',
      totalAmount: 30,
      totalItems: 2,
    })
    expect(report[0].consumptions[0]).toMatchObject({
      itemName: 'Refrigerante',
      quantity: 2,
      unitPrice: 15,
      amount: 30,
    })
  })
})
