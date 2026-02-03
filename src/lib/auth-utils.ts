/**
 * Utilitários para tratamento de erros de autenticação Supabase.
 * Centraliza detecção de refresh token inválido e limpeza de storage.
 */

const AUTH_ERROR_PATTERNS = [
  /refresh\s*token\s*not\s*found/i,
  /invalid\s*refresh\s*token/i,
  /refresh\s*token\s*expired/i,
  /session\s*expired/i,
  /session\s*not\s*found/i,
]

/**
 * Verifica se o erro é de autenticação (refresh token inválido, sessão expirada, etc.)
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { name?: string; message?: string; status?: number }
  if (err.status === 401) return true
  if (err.name === 'AuthApiError' && err.message) {
    return AUTH_ERROR_PATTERNS.some((p) => p.test(err.message ?? ''))
  }
  if (typeof err.message === 'string') {
    return AUTH_ERROR_PATTERNS.some((p) => p.test(err.message))
  }
  return false
}

const SUPABASE_AUTH_KEY_PREFIX = 'sb-'
const SUPABASE_AUTH_KEY_SUFFIX = '-auth-token'

/**
 * Remove do localStorage todas as chaves de sessão do Supabase.
 * Deve ser chamado quando o refresh token for inválido para evitar loop de erros.
 */
export function clearSupabaseAuthStorage(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        ((key.startsWith(SUPABASE_AUTH_KEY_PREFIX) && key.endsWith(SUPABASE_AUTH_KEY_SUFFIX)) ||
          key === 'sb-auth-token')
      ) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    // localStorage pode estar indisponível (privado, etc.)
  }
}
