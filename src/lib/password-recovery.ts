import { supabase } from '@/lib/supabase/client'

export interface RecoveryLinkParams {
  /** Link novo (e-mail do hook): validado só ao salvar a nova senha. */
  tokenHash: string | null
  /** Link antigo PKCE: só funciona no mesmo navegador que pediu a recuperação. */
  code: string | null
}

export function readRecoveryLinkParams(search: string): RecoveryLinkParams {
  const params = new URLSearchParams(search)
  const type = params.get('type')
  const tokenHash = params.get('token_hash')
  return {
    tokenHash: tokenHash && (!type || type === 'recovery') ? tokenHash : null,
    code: params.get('code'),
  }
}

/**
 * Cria a sessão de recuperação a partir do token_hash do e-mail.
 * Feito apenas no envio do formulário para que scanners de e-mail
 * (que abrem links automaticamente) não consumam o token de uso único.
 */
export async function verifyRecoveryTokenHash(
  tokenHash: string,
): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  })
  return { ok: !error && Boolean(data.session) }
}

export async function exchangeRecoveryCode(code: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  return { ok: !error }
}
