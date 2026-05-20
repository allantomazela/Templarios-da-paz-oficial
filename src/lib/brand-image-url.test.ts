import { describe, expect, it } from 'vitest'
import { appendCacheBust } from './brand-image-url'

describe('appendCacheBust', () => {
  it('não altera caminhos locais em public/', () => {
    expect(appendCacheBust('/logo-loja-default.png', 1)).toBe(
      '/logo-loja-default.png',
    )
  })

  it('adiciona parâmetro v em URL absoluta', () => {
    const url = appendCacheBust(
      'https://example.supabase.co/storage/v1/object/public/site-assets/logos/a.png',
      42,
    )
    expect(url).toContain('v=42')
  })

  it('substitui v existente', () => {
    const url = appendCacheBust(
      'https://example.com/logo.png?v=1',
      2,
    )
    expect(url).toContain('v=2')
    expect(url).not.toContain('v=1')
  })
})
