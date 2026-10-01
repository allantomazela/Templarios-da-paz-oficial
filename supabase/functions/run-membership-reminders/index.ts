import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/auth.ts'
import {
  loadReminderContext,
  loadReminderSettings,
  type AdminClient,
} from './reminder-context.ts'
import {
  buildReminderRecipients,
  selectReminderAlerts,
  type ReminderMode,
} from './reminder-selection.ts'
import { deliverReminders, summarizeDelivery } from './reminder-delivery.ts'

interface RunBody {
  /** Somente lista quem receberia, sem enviar nem registrar execução. */
  dryRun?: boolean
}

interface RunCounts {
  alerts_count?: number
  sent_count: number
  skipped_count: number
  failed_count: number
  message: string
  error?: string | null
}

function isServiceRoleBearer(bearer: string, serviceRoleKey: string): boolean {
  if (!bearer) return false
  if (serviceRoleKey && bearer === serviceRoleKey) return true

  try {
    const parts = bearer.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as { role?: string }
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

async function startRun(admin: AdminClient, mode: ReminderMode): Promise<string | null> {
  const { data, error } = await admin
    .from('membership_reminder_runs')
    .insert({ source: mode, started_at: new Date().toISOString() })
    .select('id')
    .single()

  if (error) {
    console.error('membership_reminder_runs insert error:', error.message)
    return null
  }
  return (data as { id: string } | null)?.id ?? null
}

async function finishRun(admin: AdminClient, runId: string | null, counts: RunCounts) {
  if (!runId) return
  await admin
    .from('membership_reminder_runs')
    .update({
      finished_at: new Date().toISOString(),
      alerts_count: counts.alerts_count ?? 0,
      sent_count: counts.sent_count,
      skipped_count: counts.skipped_count,
      failed_count: counts.failed_count,
      message: counts.message,
      error: counts.error ?? null,
    })
    .eq('id', runId)
}

serve(async (req) => {
  const headers = corsHeaders(req.headers.get('Origin'), 'POST, OPTIONS')
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!serviceRoleKey) {
    return json({ error: 'Configuração do servidor incompleta.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  // Só o job agendado (pg_cron) usa a service role; qualquer outra chamada é manual.
  const mode: ReminderMode = isServiceRoleBearer(bearer, serviceRoleKey)
    ? 'cron'
    : 'manual'

  if (mode === 'manual') {
    const auth = await requireAdmin(
      supabaseUrl,
      supabaseAnonKey,
      authHeader,
      serviceRoleKey,
    )
    if (!auth.ok) return json({ error: auth.message }, auth.status)
  }

  let body: RunBody = {}
  try {
    body = (await req.json()) as RunBody
  } catch {
    body = {}
  }
  const dryRun = body.dryRun === true

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let runId: string | null = null

  try {
    const settings = await loadReminderSettings(admin)

    if (mode === 'cron' && !settings?.membership_reminder_enabled) {
      return json({
        ok: true,
        skipped: true,
        source: mode,
        message: 'Envio automático desativado.',
      })
    }

    const context = await loadReminderContext(admin, settings)
    const alerts = selectReminderAlerts(
      context.schedules,
      new Set(context.profileById.keys()),
      mode,
      settings?.membership_reminder_frequency ?? 'after',
      Number(settings?.membership_reminder_days) || 0,
    )
    const recipients = buildReminderRecipients(
      alerts,
      context.profileById,
      context.remindedThisMonth,
    )

    if (dryRun) {
      return json({ ok: true, dryRun: true, source: mode, recipients })
    }

    runId = await startRun(admin, mode)
    const summary = await deliverReminders(admin, recipients)
    const message = summarizeDelivery(alerts.length, summary)

    await finishRun(admin, runId, {
      alerts_count: alerts.length,
      sent_count: summary.sent,
      skipped_count: summary.skippedCount,
      failed_count: summary.failed,
      message,
    })

    return json({
      ok: true,
      source: mode,
      ...summary,
      alertsCount: alerts.length,
      message,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'
    console.error('run-membership-reminders error:', message)
    await finishRun(admin, runId, {
      sent_count: 0,
      skipped_count: 0,
      failed_count: 0,
      message: 'Execução interrompida por erro.',
      error: message,
    })
    return json({ error: message }, 500)
  }
})
