import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'span',
] as const

/**
 * Converte texto puro (legado) em HTML preservando quebras de linha.
 * Enter duplo = parágrafo; Enter simples = <br>.
 */
export function normalizePranchaBodyHtml(raw: string): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return ''
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed

  return trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = block
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br>')
      return `<p>${withBreaks || '<br>'}</p>`
    })
    .join('')
}

export function sanitizePranchaHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: ['style', 'class'],
  })
}

export function pranchaHtmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const el = document.createElement('div')
  el.innerHTML = sanitizePranchaHtml(normalizePranchaBodyHtml(html))
  return (el.textContent || '').replace(/\s+/g, ' ').trim()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
