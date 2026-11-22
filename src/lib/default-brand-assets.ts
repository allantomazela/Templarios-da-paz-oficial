/**
 * Logo circular padrão em `public/` quando `site_settings.logo_url` está vazio.
 * Para nitidez em retina, use PNG ~512–768 px (ou SVG) neste ficheiro.
 */
export const PUBLIC_DEFAULT_LOGO_URL = '/logo-loja-default.png' as const

/** Favicon estático gerado a partir do logo oficial (`npm run generate:pwa-icons`). */
export const PUBLIC_DEFAULT_FAVICON_URL = '/favicon.png' as const

export function resolveSiteLogoUrl(logoUrl?: string | null): string {
  const trimmed = logoUrl?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : PUBLIC_DEFAULT_LOGO_URL
}

/**
 * Favicon da aba: configuração → logo da loja → ícone estático oficial.
 * Evita ficar com upload antigo diferente do brasão oficial.
 */
export function resolveSiteFaviconUrl(
  faviconUrl?: string | null,
  logoUrl?: string | null,
): string {
  const favicon = faviconUrl?.trim()
  if (favicon) return favicon
  const logo = logoUrl?.trim()
  if (logo) return logo
  return PUBLIC_DEFAULT_FAVICON_URL
}
