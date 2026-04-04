import DOMPurify from 'dompurify'

/**
 * Sanitiza HTML vindo de conteúdo administrável (ex.: seções customizadas) antes de renderizar.
 */
export function sanitizePublicHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  })
}
