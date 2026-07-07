import { describe, expect, it } from 'vitest'
import { FunctionsFetchError } from '@supabase/supabase-js'
import { formatEdgeFunctionInvokeError } from '@/lib/edge-function-invoke'

describe('formatEdgeFunctionInvokeError', () => {
  it('retorna mensagem amigável para falha de rede/CORS', () => {
    const error = new FunctionsFetchError({} as Response)
    expect(formatEdgeFunctionInvokeError(error)).toContain('indisponível')
  })

  it('detecta erro de rede genérico', () => {
    expect(
      formatEdgeFunctionInvokeError(new Error('Failed to fetch')),
    ).toContain('indisponível')
  })

  it('repassa mensagem de Error comum', () => {
    expect(formatEdgeFunctionInvokeError(new Error('Sessão expirada'))).toBe(
      'Sessão expirada',
    )
  })
})
