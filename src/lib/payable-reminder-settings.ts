import { supabase } from '@/lib/supabase/client'
import type { PayableReminderSettings, PayableReminderRun } from '@/lib/financial-payable-types'
import { formatEdgeFunctionInvokeError } from '@/lib/edge-function-invoke'
import { logError } from '@/lib/logger'

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
  try {
    const { data, error } = await supabase.functions.invoke('run-payables-reminders', {
      body: { source: 'manual' },
    })

    if (error) {
      logError('run-payables-reminders invoke error', error)
      return { ok: false, error: formatEdgeFunctionInvokeError(error) }
    }

    const payload = (data ?? { ok: false }) as PayableReminderRunResult & {
      error?: string
    }

    if (payload.error) {
      return { ok: false, error: payload.error }
    }

    return {
      ok: Boolean(payload.ok),
      skipped: payload.skipped,
      message: payload.message,
      sent: payload.sent,
      skippedCount: payload.skippedCount,
      failed: payload.failed,
    }
  } catch (error) {
    logError('runPayablesRemindersManual failed', error)
    return {
      ok: false,
      error: formatEdgeFunctionInvokeError(error),
    }
  }
}

function isMissingRelationError(error: { code?: string; message?: string }): boolean {
  if (error.code === '42P01' || error.code === 'PGRST205') return true
  const message = error.message?.toLowerCase() ?? ''
  return message.includes('payable_reminder_runs') && message.includes('does not exist')
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

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

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
