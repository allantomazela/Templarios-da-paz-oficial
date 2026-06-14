import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'

export async function sendMembershipOverdueReminder(params: {
  brotherId: string
  email: string
  fullName: string
  overdueLabels: string[]
  overdueAmount: number
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-user-email', {
      body: {
        type: 'membership_overdue',
        email: params.email.trim().toLowerCase(),
        full_name: params.fullName.trim(),
        profile_id: params.brotherId,
        overdue_labels: params.overdueLabels,
        overdue_amount: params.overdueAmount,
      },
    })

    if (error) {
      logError('send-user-email membership_overdue invoke error', error)
      return { ok: false, error: error.message }
    }

    const payload = data as { error?: string; skipped?: boolean; success?: boolean }
    if (payload?.error) {
      return { ok: false, error: payload.error }
    }

    return { ok: true, skipped: payload?.skipped }
  } catch (e) {
    logError('sendMembershipOverdueReminder failed', e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erro ao enviar lembrete',
    }
  }
}
