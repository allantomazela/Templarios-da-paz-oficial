import { describe, expect, it } from 'vitest'
import { summarizeConnectivity, type ConnectivityProbeResult } from '@/lib/connectivity-check'

describe('connectivity-check', () => {
  it('identifica falhas em probes obrigatórios', () => {
    const results: ConnectivityProbeResult[] = [
      {
        id: 'site',
        label: 'Site',
        url: 'https://example.com/favicon.png',
        ok: true,
        required: true,
      },
      {
        id: 'supabase-api',
        label: 'Supabase',
        url: 'https://x.supabase.co/rest/v1/',
        ok: false,
        required: true,
        error: 'Failed to fetch',
      },
    ]

    const summary = summarizeConnectivity(results)
    expect(summary.allRequiredOk).toBe(false)
    expect(summary.failedRequired).toHaveLength(1)
  })
})
