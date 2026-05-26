const PRODUCTION_ORIGIN = 'https://templariosdapazoficial.com.br'

/** URL base do app para redirects de auth (cadastro, recuperação de senha). */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return PRODUCTION_ORIGIN
}
