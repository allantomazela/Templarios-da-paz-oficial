import { supabase } from '@/lib/supabase/client'
import type { ReminderSettings } from '@/lib/data'
import { logError } from '@/lib/logger'

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  frequency: 'after',
  days: 3,
}

export async function fetchMembershipReminderSettings(): Promise<ReminderSettings> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('site_settings')
    .select(
      'membership_reminder_enabled, membership_reminder_frequency, membership_reminder_days',
    )
    .eq('id', 1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error

  if (!data) return DEFAULT_SETTINGS

  const frequency = data.membership_reminder_frequency
  const validFrequency =
    frequency === 'before' || frequency === 'on_due' || frequency === 'after'
      ? frequency
      : DEFAULT_SETTINGS.frequency

  return {
    enabled: Boolean(data.membership_reminder_enabled),
    frequency: validFrequency,
    days: Number(data.membership_reminder_days) || DEFAULT_SETTINGS.days,
  }
}

export async function saveMembershipReminderSettings(
  settings: ReminderSettings,
): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('site_settings')
    .update({
      membership_reminder_enabled: settings.enabled,
      membership_reminder_frequency: settings.frequency,
      membership_reminder_days: Math.max(0, settings.days),
    })
    .eq('id', 1)

  if (error) throw error
}

export interface MembershipReminderRunResult {
  ok: boolean
  skipped?: boolean
  message?: string
  sent?: number
  skippedCount?: number
  failed?: number
  error?: string
}

export async function runMembershipRemindersManual(): Promise<MembershipReminderRunResult> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'run-membership-reminders',
      { body: { source: 'manual' } },
    )

    if (error) {
      logError('run-membership-reminders invoke error', error)
      return { ok: false, error: error.message }
    }

    const payload = data as MembershipReminderRunResult & { error?: string }
    if (payload?.error) {
      return { ok: false, error: payload.error }
    }

    return {
      ok: true,
      skipped: payload.skipped,
      message: payload.message,
      sent: payload.sent,
      skippedCount: payload.skippedCount,
      failed: payload.failed,
    }
  } catch (e) {
    logError('runMembershipRemindersManual failed', e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erro ao executar lembretes',
    }
  }
}
