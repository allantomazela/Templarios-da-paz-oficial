/** Fontes com fallback nativo — não dependem de Google Fonts (redes corporativas). */

export interface SiteFontOption {
  value: string
  label: string
  family: string
}

export const SYSTEM_FONT_STACK =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

export const FONT_OPTIONS: SiteFontOption[] = [
  { value: 'Inter', label: 'Inter (Padrão)', family: SYSTEM_FONT_STACK },
  {
    value: 'Roboto',
    label: 'Roboto',
    family: 'Roboto, system-ui, sans-serif',
  },
  {
    value: 'Open Sans',
    label: 'Open Sans',
    family: '"Open Sans", system-ui, sans-serif',
  },
  { value: 'Lato', label: 'Lato', family: 'Lato, system-ui, sans-serif' },
  {
    value: 'Montserrat',
    label: 'Montserrat',
    family: 'Montserrat, system-ui, sans-serif',
  },
  {
    value: 'Playfair Display',
    label: 'Playfair Display (Serif)',
    family: '"Playfair Display", Georgia, "Times New Roman", serif',
  },
  {
    value: 'Merriweather',
    label: 'Merriweather (Serif)',
    family: 'Merriweather, Georgia, "Times New Roman", serif',
  },
]

export const OLD_ENGLISH_FONT_STACK =
  'Georgia, "Times New Roman", "New York", serif'

export function resolveFontFamily(fontValue: string | undefined): string {
  const match = FONT_OPTIONS.find((option) => option.value === fontValue)
  return match?.family ?? SYSTEM_FONT_STACK
}

export function applySiteFont(fontValue: string | undefined): void {
  document.body.style.fontFamily = resolveFontFamily(fontValue)
}
