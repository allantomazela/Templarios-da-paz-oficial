import { supabase } from '@/lib/supabase/client'
import type { ReminderSettings } from '@/lib/data'
import { formatEdgeFunctionInvokeError } from '@/lib/edge-function-invoke'
import { logError } from '@/lib/logger'

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  frequency: 'after',
  days: 0,
}

export async function fetchMembershipReminderSettings(): Promise<ReminderSettings> {
  const { data, error } = await supabase
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
  const { error } = await supabase
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

export interface MembershipReminderRun {
  id: string
  source: 'cron' | 'manual'
  startedAt: string
  finishedAt: string | null
  alertsCount: number
  sentCount: number
  skippedCount: number
  failedCount: number
  message: string | null
  error: string | null
}

export async function fetchMembershipReminderRuns(
  limit = 15,
): Promise<MembershipReminderRun[]> {
  const { data, error } = await supabase
    .from('membership_reminder_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(
    (row: {
      id: string
      source: 'cron' | 'manual'
      started_at: string
      finished_at: string | null
      alerts_count: number
      sent_count: number
      skipped_count: number
      failed_count: number
      message: string | null
      error: string | null
    }) => ({
      id: row.id,
      source: row.source,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      alertsCount: row.alerts_count ?? 0,
      sentCount: row.sent_count ?? 0,
      skippedCount: row.skipped_count ?? 0,
      failedCount: row.failed_count ?? 0,
      message: row.message,
      error: row.error,
    }),
  )
}

/** Irmão que receberia o lembrete no envio manual (prévia). */
export interface MembershipReminderRecipient {
  brotherId: string
  brotherName: string
  email: string | null
  overdueLabels: string[]
  overdueAmount: number
  overdueCount: number
  alreadyRemindedThisMonth: boolean
}

export interface MembershipReminderPreviewResult {
  ok: boolean
  recipients: MembershipReminderRecipient[]
  error?: string
}

interface InvokeResult<T> {
  ok: boolean
  payload?: T
  error?: string
}

async function invokeMembershipReminders<T>(
  body: Record<string, unknown>,
): Promise<InvokeResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'run-membership-reminders',
      { body },
    )

    if (error) {
      logError('run-membership-reminders invoke error', error)
      return { ok: false, error: formatEdgeFunctionInvokeError(error) }
    }

    const payload = data as T & { error?: string }
    if (payload?.error) return { ok: false, error: payload.error }
    return { ok: true, payload }
  } catch (e) {
    logError('run-membership-reminders invoke failed', e)
    return { ok: false, error: formatEdgeFunctionInvokeError(e) }
  }
}

/** Lista quem receberia o lembrete manual, sem enviar nada. */
export async function previewMembershipReminders(): Promise<MembershipReminderPreviewResult> {
  const result = await invokeMembershipReminders<{
    recipients?: MembershipReminderRecipient[]
  }>({ dryRun: true })

  if (!result.ok) return { ok: false, recipients: [], error: result.error }
  return { ok: true, recipients: result.payload?.recipients ?? [] }
}

/** Envia agora para todos com mensalidade em atraso (máx. 1 por irmão/mês). */
export async function sendMembershipRemindersNow(): Promise<MembershipReminderRunResult> {
  const result = await invokeMembershipReminders<MembershipReminderRunResult>({})
  if (!result.ok) return { ok: false, error: result.error }

  const payload = result.payload ?? { ok: true }
  return {
    ok: true,
    skipped: payload.skipped,
    message: payload.message,
    sent: payload.sent,
    skippedCount: payload.skippedCount,
    failed: payload.failed,
  }
}
