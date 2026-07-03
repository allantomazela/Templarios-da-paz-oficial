import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdminOrEditor } from '../_shared/auth.ts'
import { sendViaResend } from '../_shared/resend-mail.ts'

interface RunBody {
  source?: 'cron' | 'manual'
}

interface PayableRow {
  id: string
  description: string
  amount: number
  due_date: string
  status: string
  supplier_name: string | null
}

interface SettingsRow {
  payable_reminder_enabled: boolean
  payable_reminder_frequency: 'before' | 'on_due' | 'after'
  payable_reminder_days: number
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

function todayBrazilISODate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function shouldSendPayableReminder(
  dueDate: string,
  frequency: 'before' | 'on_due' | 'after',
  days: number,
  today: string,
): boolean {
  const due = new Date(`${dueDate}T12:00:00`)
  const ref = new Date(`${today}T12:00:00`)
  const diffDays = Math.round((due.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24))

  switch (frequency) {
    case 'before':
      return diffDays >= 0 && diffDays <= days
    case 'on_due':
      return diffDays === 0
    case 'after':
      return diffDays < 0 && Math.abs(diffDays) >= days
    default:
      return false
  }
}

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function buildPayablesDigestEmail(payables: PayableRow[]): { subject: string; html: string } {
  const rows = payables
    .map(
      (payable) =>
        `<tr><td style="padding:8px;border:1px solid #e5e7eb">${payable.due_date.split('-').reverse().join('/')}</td><td style="padding:8px;border:1px solid #e5e7eb">${payable.description}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${formatCurrencyBRL(Number(payable.amount))}</td></tr>`,
    )
    .join('')

  return {
    subject: `[Templários] ${payables.length} conta(s) a pagar requerem atenção`,
    html: `
      <p>Olá,</p>
      <p>As seguintes contas a pagar estão dentro da janela configurada de lembretes:</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Vencimento</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Descrição</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right">Valor</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Acesse o sistema em Financeiro → Contas a pagar para registrar o pagamento.</p>
    `,
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  const headers = corsHeaders(origin, 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader = req.headers.get('Authorization')
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : ''
  const isServiceRole = isServiceRoleBearer(bearer, serviceRoleKey)

  if (!serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Configuração incompleta.' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  let body: RunBody = {}
  try {
    body = (await req.json()) as RunBody
  } catch {
    body = {}
  }

  const source = body.source === 'cron' ? 'cron' : 'manual'

  if (!isServiceRole) {
    const auth = await requireAdminOrEditor(
      supabaseUrl,
      supabaseAnonKey,
      authHeader,
      serviceRoleKey,
    )
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const startedAt = new Date().toISOString()
  let runId: string | null = null

  const { data: runRow } = await admin
    .from('payable_reminder_runs')
    .insert({ source, started_at: startedAt })
    .select('id')
    .single()

  runId = runRow?.id ?? null

  async function finalizeRun(payload: {
    alerts_count?: number
    sent_count: number
    skipped_count: number
    failed_count: number
    message: string
    error?: string | null
  }) {
    if (!runId) return
    await admin
      .from('payable_reminder_runs')
      .update({
        finished_at: new Date().toISOString(),
        alerts_count: payload.alerts_count ?? 0,
        sent_count: payload.sent_count,
        skipped_count: payload.skipped_count,
        failed_count: payload.failed_count,
        message: payload.message,
        error: payload.error ?? null,
      })
      .eq('id', runId)
  }

  try {
    const { data: settingsRow, error: settingsError } = await admin
      .from('site_settings')
      .select(
        'payable_reminder_enabled, payable_reminder_frequency, payable_reminder_days',
      )
      .eq('id', 1)
      .maybeSingle()

    if (settingsError) throw settingsError

    const settings = settingsRow as SettingsRow | null
    if (!settings?.payable_reminder_enabled && source === 'cron') {
      const message = 'Lembretes de contas a pagar desativados.'
      await finalizeRun({
        sent_count: 0,
        skipped_count: 0,
        failed_count: 0,
        message,
      })
      return new Response(JSON.stringify({ ok: true, skipped: true, message }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const frequency = settings?.payable_reminder_frequency ?? 'before'
    const days = Number(settings?.payable_reminder_days) || 3
    const today = todayBrazilISODate()

    const [{ data: payables, error: payablesError }, { data: staff, error: staffError }] =
      await Promise.all([
        admin
          .from('financial_payables')
          .select('id, description, amount, due_date, status, supplier_name')
          .in('status', ['Pendente', 'Atrasado'])
          .order('due_date', { ascending: true }),
        admin
          .from('profiles')
          .select('email, full_name, role')
          .in('role', ['admin', 'editor'])
          .not('email', 'is', null),
      ])

    if (payablesError) throw payablesError
    if (staffError) throw staffError

    const alertPayables = (payables ?? []).filter((row: PayableRow) =>
      shouldSendPayableReminder(row.due_date, frequency, days, today),
    )

    if (alertPayables.length === 0) {
      const message = 'Nenhuma conta a pagar na janela de lembrete hoje.'
      await finalizeRun({
        alerts_count: 0,
        sent_count: 0,
        skipped_count: 0,
        failed_count: 0,
        message,
      })
      return new Response(JSON.stringify({ ok: true, message, sent: 0 }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const { data: logsToday } = await admin
      .from('payable_reminder_logs')
      .select('payable_id')
      .eq('sent_date', today)

    const alreadyLogged = new Set((logsToday ?? []).map((log: { payable_id: string }) => log.payable_id))
    const pendingAlerts = alertPayables.filter((row: PayableRow) => !alreadyLogged.has(row.id))

    const recipients = Array.from(
      new Set(
        (staff ?? [])
          .map((profile: { email: string | null }) => profile.email?.trim())
          .filter((email: string | undefined): email is string => Boolean(email)),
      ),
    )

    if (recipients.length === 0) {
      throw new Error('Nenhum e-mail de admin/editor cadastrado para receber lembretes.')
    }

    const { subject, html } = buildPayablesDigestEmail(pendingAlerts.length > 0 ? pendingAlerts : alertPayables)
    let sent = 0
    let failed = 0

    for (const email of recipients) {
      const result = await sendViaResend({ to: email, subject, html })
      if (result.ok) sent++
      else failed++
    }

    const payablesToLog = pendingAlerts.length > 0 ? pendingAlerts : []
    for (const payable of payablesToLog) {
      for (const email of recipients) {
        await admin.from('payable_reminder_logs').insert({
          payable_id: payable.id,
          recipient_email: email,
          sent_date: today,
        })
      }
    }

    const message = `${alertPayables.length} alerta(s); ${sent} e-mail(s) enviado(s).`
    await finalizeRun({
      alerts_count: alertPayables.length,
      sent_count: sent,
      skipped_count: alertPayables.length - payablesToLog.length,
      failed_count: failed,
      message,
    })

    return new Response(
      JSON.stringify({
        ok: failed === 0,
        message,
        sent,
        failed,
        alerts: alertPayables.length,
      }),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'
    await finalizeRun({
      sent_count: 0,
      skipped_count: 0,
      failed_count: 1,
      message: 'Falha na execução',
      error: message,
    })
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
