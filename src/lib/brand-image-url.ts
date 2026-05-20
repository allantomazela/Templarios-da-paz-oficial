/**
 * Anexa parâmetro de cache-bust em URLs públicas (Storage/CDN) para forçar
 * o navegador a buscar a versão mais recente após upload ou salvamento.
 */
export function appendCacheBust(
  url: string,
  version?: string | number,
): string {
  const trimmed = url?.trim()
  if (!trimmed) return trimmed

  // URLs locais (public/) não precisam de bust
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }

  const v = version ?? Date.now()
  try {
    const parsed = new URL(trimmed)
    parsed.searchParams.set('v', String(v))
    return parsed.toString()
  } catch {
    const sep = trimmed.includes('?') ? '&' : '?'
    return `${trimmed}${sep}v=${encodeURIComponent(String(v))}`
  }
}
