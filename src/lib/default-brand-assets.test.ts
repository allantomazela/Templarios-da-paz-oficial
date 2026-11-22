import { describe, expect, it } from 'vitest'
import {
  PUBLIC_DEFAULT_FAVICON_URL,
  PUBLIC_DEFAULT_LOGO_URL,
  resolveSiteFaviconUrl,
  resolveSiteLogoUrl,
} from './default-brand-assets'

describe('resolveSiteLogoUrl', () => {
  it('usa logo configurado quando presente', () => {
    expect(resolveSiteLogoUrl('https://cdn.example/logo.png')).toBe(
      'https://cdn.example/logo.png',
    )
  })

  it('cai no logo oficial local quando vazio', () => {
    expect(resolveSiteLogoUrl('')).toBe(PUBLIC_DEFAULT_LOGO_URL)
    expect(resolveSiteLogoUrl(null)).toBe(PUBLIC_DEFAULT_LOGO_URL)
  })
})

describe('resolveSiteFaviconUrl', () => {
  it('prioriza favicon configurado', () => {
    expect(
      resolveSiteFaviconUrl(
        'https://cdn.example/favicon.png',
        'https://cdn.example/logo.png',
      ),
    ).toBe('https://cdn.example/favicon.png')
  })

  it('usa o logo quando favicon está vazio', () => {
    expect(resolveSiteFaviconUrl('', 'https://cdn.example/logo.png')).toBe(
      'https://cdn.example/logo.png',
    )
  })

  it('cai no favicon estático oficial', () => {
    expect(resolveSiteFaviconUrl(null, null)).toBe(PUBLIC_DEFAULT_FAVICON_URL)
  })
})
