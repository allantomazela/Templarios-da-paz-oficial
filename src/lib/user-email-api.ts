import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'

export type UserEmailType = 'signup_pending' | 'account_approved'

export async function sendUserEmail(params: {
  type: UserEmailType
  email: string
  fullName: string
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-user-email', {
      body: {
        type: params.type,
        email: params.email.trim().toLowerCase(),
        full_name: params.fullName.trim(),
      },
    })

    if (error) {
      logError('send-user-email invoke error', error)
      return { ok: false, error: error.message }
    }

    const payload = data as { error?: string; skipped?: boolean; success?: boolean }
    if (payload?.error) {
      return { ok: false, error: payload.error }
    }

    return { ok: true, skipped: payload?.skipped }
  } catch (e) {
    logError('send-user-email failed', e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erro ao enviar e-mail',
    }
  }
}
