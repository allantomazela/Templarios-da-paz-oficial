import type { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import {
  buildAllMembershipSchedules,
  type BrotherMembershipSchedule,
  type Contribution,
  type MembershipFeeScheduleSettings,
} from '../_shared/membership-schedule.ts'
import {
  DEFAULT_MEMBERSHIP_BASE_AMOUNT,
  DEFAULT_MEMBERSHIP_SESSION_PACKAGE_AMOUNT,
  inferMembershipSituation,
  type BrotherSituationFields,
} from '../_shared/membership-situation.ts'
import type { ReminderProfile } from './reminder-selection.ts'

export type AdminClient = ReturnType<typeof createClient>

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

interface ContributionRow {
  id: string
  brother_id: string
  month: number
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
}

export interface ReminderSettingsRow {
  membership_reminder_enabled: boolean
  membership_reminder_frequency: 'before' | 'on_due' | 'after'
  membership_reminder_days: number
  membership_fee_amount: number | null
  membership_fee_due_day: number | null
  membership_fee_base_amount: number | null
  membership_fee_session_package_amount: number | null
}

interface ApprovedProfileRow {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
  brothers?: BrotherSituationFields | BrotherSituationFields[] | null
}

export interface ReminderContext {
  schedules: BrotherMembershipSchedule[]
  profileById: Map<string, ReminderProfile>
  remindedThisMonth: Set<string>
}

/** Mesma composição de fetchMembershipFeeSettings (src/lib/contribution-payments.ts). */
function buildFeeSettings(
  settings: ReminderSettingsRow | null,
): MembershipFeeScheduleSettings {
  const baseAmount =
    Number(settings?.membership_fee_base_amount) || DEFAULT_MEMBERSHIP_BASE_AMOUNT
  const sessionPackageAmount =
    Number(settings?.membership_fee_session_package_amount) ||
    DEFAULT_MEMBERSHIP_SESSION_PACKAGE_AMOUNT

  return {
    baseAmount,
    sessionPackageAmount,
    defaultAmount:
      Number(settings?.membership_fee_amount) || baseAmount + sessionPackageAmount,
    dueDay: Number(settings?.membership_fee_due_day) || 10,
  }
}

function brotherRowOf(profile: ApprovedProfileRow): BrotherSituationFields | null {
  return Array.isArray(profile.brothers)
    ? profile.brothers[0] ?? null
    : profile.brothers ?? null
}

function mapContributionRow(row: ContributionRow): Contribution {
  return {
    id: row.id,
    brotherId: row.brother_id,
    month: CONTRIBUTION_MONTHS[row.month - 1] ?? String(row.month),
    year: row.year,
    amount: Number(row.amount),
    status: row.status,
  }
}

export function todayBrazilISODate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function brazilYearMonth(): string {
  return todayBrazilISODate().slice(0, 7)
}

export async function loadReminderSettings(
  admin: AdminClient,
): Promise<ReminderSettingsRow | null> {
  const { data, error } = await admin
    .from('site_settings')
    .select(
      'membership_reminder_enabled, membership_reminder_frequency, membership_reminder_days, membership_fee_amount, membership_fee_due_day, membership_fee_base_amount, membership_fee_session_package_amount',
    )
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return data as ReminderSettingsRow | null
}

export async function loadReminderContext(
  admin: AdminClient,
  settings: ReminderSettingsRow | null,
): Promise<ReminderContext> {
  const currentMonth = brazilYearMonth()
  const [profilesResult, contributionsResult, logsResult] = await Promise.all([
    admin
      .from('profiles')
      .select(
        'id, full_name, email, created_at, brothers!brothers_profile_id_fkey(status, regular_status, membership_situation)',
      )
      .eq('status', 'approved'),
    admin.from('contributions').select('id, brother_id, month, year, amount, status'),
    admin
      .from('reminder_logs')
      .select('brother_id, sent_date')
      .gte('sent_date', `${currentMonth}-01`),
  ])

  if (profilesResult.error) throw profilesResult.error
  if (contributionsResult.error) throw contributionsResult.error
  if (logsResult.error) throw logsResult.error

  const profiles = (profilesResult.data || []) as ApprovedProfileRow[]
  const contributions = (contributionsResult.data || []).map((row) =>
    mapContributionRow(row as ContributionRow),
  )

  const brotherNames: Record<string, string> = {}
  for (const profile of profiles) {
    brotherNames[profile.id] = profile.full_name?.trim() || 'Sem nome'
  }

  const schedules = buildAllMembershipSchedules(
    contributions,
    profiles.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      created_at: p.created_at,
      membershipSituation: inferMembershipSituation(brotherRowOf(p)),
    })),
    brotherNames,
    buildFeeSettings(settings),
  )

  const remindedThisMonth = new Set(
    ((logsResult.data || []) as { brother_id: string; sent_date: string }[])
      .filter((log) => String(log.sent_date).startsWith(currentMonth))
      .map((log) => log.brother_id),
  )

  return {
    schedules,
    profileById: new Map(
      profiles.map((p) => [p.id, { fullName: p.full_name, email: p.email }]),
    ),
    remindedThisMonth,
  }
}
