import { supabase } from '@/lib/supabase/client'
import type { PayableReminderSettings, PayableReminderRun } from '@/lib/financial-payable-types'

const DEFAULT_SETTINGS: PayableReminderSettings = {
  enabled: false,
  frequency: 'before',
  days: 3,
}

export async function fetchPayableReminderSettings(): Promise<PayableReminderSettings> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('site_settings')
    .select(
      'payable_reminder_enabled, payable_reminder_frequency, payable_reminder_days',
    )
    .eq('id', 1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  if (!data) return DEFAULT_SETTINGS

  const frequency = data.payable_reminder_frequency
  const validFrequency =
    frequency === 'before' || frequency === 'on_due' || frequency === 'after'
      ? frequency
      : DEFAULT_SETTINGS.frequency

  return {
    enabled: Boolean(data.payable_reminder_enabled),
    frequency: validFrequency,
    days: Number(data.payable_reminder_days) || DEFAULT_SETTINGS.days,
  }
}

export async function savePayableReminderSettings(
  settings: PayableReminderSettings,
): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('site_settings')
    .update({
      payable_reminder_enabled: settings.enabled,
      payable_reminder_frequency: settings.frequency,
      payable_reminder_days: Math.max(0, Math.min(60, settings.days)),
    })
    .eq('id', 1)

  if (error) throw error
}

export interface PayableReminderRunResult {
  ok: boolean
  skipped?: boolean
  message?: string
  sent?: number
  skippedCount?: number
  failed?: number
  error?: string
}

export async function runPayablesRemindersManual(): Promise<PayableReminderRunResult> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny.functions.invoke('run-payables-reminders', {
    body: { source: 'manual' },
  })

  if (error) throw error
  return (data ?? { ok: false }) as PayableReminderRunResult
}

export async function fetchPayableReminderRuns(
  limit = 15,
): Promise<PayableReminderRun[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('payable_reminder_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    source: row.source as 'cron' | 'manual',
    startedAt: row.started_at as string,
    finishedAt: (row.finished_at as string | null) ?? null,
    alertsCount: Number(row.alerts_count ?? 0),
    sentCount: Number(row.sent_count ?? 0),
    skippedCount: Number(row.skipped_count ?? 0),
    failedCount: Number(row.failed_count ?? 0),
    message: (row.message as string | null) ?? null,
    error: (row.error as string | null) ?? null,
  }))
}
