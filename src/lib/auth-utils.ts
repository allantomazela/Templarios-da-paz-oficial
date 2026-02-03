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
 * Não trata como auth: 403 (permissão/RLS), código 42501 (RLS) ou erros PostgREST de política.
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as {
    name?: string
    message?: string
    status?: number
    code?: string
  }
  // 403 = permissão negada (RLS), não redirecionar para login
  if (err.status === 403) return false
  // Erro de RLS no Postgres / PostgREST - não é falha de auth
  if (err.code === '42501' || (typeof err.message === 'string' && /row-level security|policy/i.test(err.message))) {
    return false
  }
  if (err.status === 401) return true
  if (err.name === 'AuthApiError' && err.message) {
    return AUTH_ERROR_PATTERNS.some((p) => p.test(err.message ?? ''))
  }
  if (typeof err.message === 'string') {
    return AUTH_ERROR_PATTERNS.some((p) => p.test(err.message))
  }
  return false
}

/**
 * Retorna mensagem amigável para erros de salvamento (RLS, permissão, rede).
 */
export function getSaveErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Não foi possível salvar. Tente novamente.'
  const err = error as { message?: string; code?: string; status?: number }
  if (err.code === '42501' || (typeof err.message === 'string' && /row-level security|policy/i.test(err.message ?? ''))) {
    return 'Você não tem permissão para esta ação. Verifique se está logado como admin/editor.'
  }
  if (err.status === 403) return 'Acesso negado. Verifique suas permissões.'
  if (err.status === 401) return 'Sessão expirada. Faça login novamente.'
  if (typeof err.message === 'string' && err.message.length > 0 && err.message.length < 200) {
    return err.message
  }
  return 'Não foi possível salvar. Tente novamente.'
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
