import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdminOrEditor } from '../_shared/auth.ts'
import { sendViaResend } from '../_shared/resend-mail.ts'
import { membershipOverdueReminderEmail } from '../_shared/user-email-templates.ts'
import {
  buildAllMembershipSchedules,
  buildReminderAlerts,
  type Contribution,
  type MembershipFeeScheduleSettings,
} from '../_shared/membership-schedule.ts'

const CONTRIBUTION_MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

interface RunBody {
  source?: 'cron' | 'manual'
}

interface ContributionRow {
  id: string
  brother_id: string
  month: number
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
}

interface ReminderSettingsRow {
  membership_reminder_enabled: boolean
  membership_reminder_frequency: 'before' | 'on_due' | 'after'
  membership_reminder_days: number
  membership_fee_amount: number | null
  membership_fee_due_day: number | null
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

function monthNumberToName(month: number): string {
  return CONTRIBUTION_MONTHS[month - 1] ?? String(month)
}

function mapContributionRow(row: ContributionRow): Contribution {
  return {
    id: row.id,
    brotherId: row.brother_id,
    month: monthNumberToName(row.month),
    year: row.year,
    amount: Number(row.amount),
    status: row.status,
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
    return new Response(
      JSON.stringify({ error: 'Configuração do servidor incompleta.' }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
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

  try {
    const { data: settingsRow, error: settingsError } = await admin
      .from('site_settings')
      .select(
        'membership_reminder_enabled, membership_reminder_frequency, membership_reminder_days, membership_fee_amount, membership_fee_due_day',
      )
      .eq('id', 1)
      .maybeSingle()

    if (settingsError) throw settingsError

    const settings = settingsRow as ReminderSettingsRow | null
    const enabled = Boolean(settings?.membership_reminder_enabled)

    if (!enabled) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          message: 'Lembretes automáticos estão desativados.',
          source,
        }),
        {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const feeSettings: MembershipFeeScheduleSettings = {
      defaultAmount: Number(settings?.membership_fee_amount) || 150,
      dueDay: Number(settings?.membership_fee_due_day) || 10,
    }

    const frequency = settings?.membership_reminder_frequency ?? 'after'
    const days = Number(settings?.membership_reminder_days) || 0

    const [{ data: brothers, error: brothersError }, { data: contributionsData, error: contributionsError }, { data: logsToday, error: logsError }] =
      await Promise.all([
        admin
          .from('profiles')
          .select('id, full_name, email, created_at')
          .eq('status', 'approved'),
        admin.from('contributions').select('id, brother_id, month, year, amount, status'),
        admin
          .from('reminder_logs')
          .select('brother_id')
          .eq('sent_date', todayBrazilISODate()),
      ])

    if (brothersError) throw brothersError
    if (contributionsError) throw contributionsError
    if (logsError) throw logsError

    const contributions = (contributionsData || []).map((row) =>
      mapContributionRow(row as ContributionRow)
    )

    const brotherNames: Record<string, string> = {}
    for (const brother of brothers || []) {
      brotherNames[brother.id] = brother.full_name?.trim() || 'Sem nome'
    }

    const schedules = buildAllMembershipSchedules(
      contributions,
      (brothers || []).map((b) => ({
        id: b.id,
        full_name: b.full_name,
        created_at: b.created_at,
      })),
      brotherNames,
      feeSettings,
    )

    const alerts = buildReminderAlerts(schedules, frequency, days)
    const sentToday = new Set((logsToday || []).map((l) => l.brother_id))

    const profileById = new Map(
      (brothers || []).map((b) => [b.id, b]),
    )

    let sent = 0
    let skippedCount = 0
    let failed = 0

    for (const alert of alerts) {
      if (sentToday.has(alert.brotherId)) {
        skippedCount++
        continue
      }

      const profile = profileById.get(alert.brotherId)
      const email = profile?.email?.trim().toLowerCase()
      if (!email) {
        failed++
        continue
      }

      const mail = membershipOverdueReminderEmail(
        profile?.full_name?.trim() || alert.brotherName,
        alert.overdueLabels,
        alert.overdueAmount,
      )

      const result = await sendViaResend({
        to: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      })

      if (!result.ok) {
        failed++
        continue
      }

      const { error: logError } = await admin.from('reminder_logs').insert({
        brother_id: alert.brotherId,
        contribution_id: null,
        sent_date: todayBrazilISODate(),
        method: 'Email',
      })

      if (logError) {
        failed++
        continue
      }

      sentToday.add(alert.brotherId)
      sent++
    }

    const parts: string[] = []
    if (alerts.length === 0) {
      parts.push('Nenhum irmão elegível para lembrete hoje.')
    } else {
      parts.push(`${sent} lembrete(s) enviado(s) por e-mail.`)
      if (skippedCount > 0) {
        parts.push(`${skippedCount} ignorado(s) (já enviado hoje).`)
      }
      if (failed > 0) {
        parts.push(`${failed} falha(s).`)
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        source,
        sent,
        skippedCount,
        failed,
        message: parts.join(' '),
      }),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'
    console.error('run-membership-reminders error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
