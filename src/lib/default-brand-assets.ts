/**
 * Logo circular padrão em `public/` quando `site_settings.logo_url` está vazio.
 * Para nitidez em retina, use PNG ~512–768 px (ou SVG) neste ficheiro.
 */
export const PUBLIC_DEFAULT_LOGO_URL = '/logo-loja-default.png' as const

export function resolveSiteLogoUrl(logoUrl?: string | null): string {
  const trimmed = logoUrl?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : PUBLIC_DEFAULT_LOGO_URL
}
