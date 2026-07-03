import { supabase } from '@/lib/supabase/client'
import { toError } from '@/lib/async-utils'
import { todayLocalISODate } from '@/lib/format-utils'
import type { Contribution, Transaction } from '@/lib/data'
import { isMembershipHistoricalPeriod, isMembershipBackfillContribution, isMembershipControlOnlyContribution } from '@/lib/membership-schedule'
import {
  buildControlOnlyNotes,
  extractMensalidadeReferenceFromDescription,
  mensalidadeDescriptionMatchesBrother,
  mensalidadeReferenceMatchesPeriod,
  sortLinkableMensalidadeRows,
  stripControlOnlyNote,
  type ContributionTreasuryMode,
} from '@/lib/membership-control-only'

export type { ContributionTreasuryMode }

export const MENSALIDADE_CATEGORY = 'Mensalidade'

/** Observações da mensalidade prontas para `attachment_notes` da receita no caixa. */
export function formatContributionNotesForFinancialTransaction(
  notes?: string | null,
): string | null {
  const cleaned = stripControlOnlyNote(notes)
  return cleaned || null
}

export function enrichTransactionsWithContributionNotes(
  transactions: Transaction[],
  notesByTransactionId: Record<string, string>,
): Transaction[] {
  return transactions.map((transaction) => {
    const fromContribution = notesByTransactionId[transaction.id]?.trim()
    if (!fromContribution || transaction.attachmentNotes?.trim()) {
      return transaction
    }
    return { ...transaction, attachmentNotes: fromContribution }
  })
}

export async function fetchContributionNotesByTransactionIds(
  transactionIds: string[],
): Promise<Record<string, string>> {
  if (transactionIds.length === 0) return {}

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('contributions')
    .select('transaction_id, notes')
    .in('transaction_id', transactionIds)
    .not('transaction_id', 'is', null)

  if (error) {
    throw toError(error, 'Falha ao carregar observações das mensalidades.')
  }

  const result: Record<string, string> = {}

  for (const row of data ?? []) {
    const transactionId = row.transaction_id as string | null
    if (!transactionId) continue

    const formatted = formatContributionNotesForFinancialTransaction(row.notes)
    if (!formatted) continue

    if (result[transactionId] && result[transactionId] !== formatted) {
      if (!result[transactionId].includes(formatted)) {
        result[transactionId] = `${result[transactionId]}\n${formatted}`
      }
      continue
    }

    result[transactionId] = formatted
  }

  return result
}

/** Copia observações das mensalidades para receitas que ainda não têm `attachment_notes`. */
export async function repairContributionNotesOnTransactions(): Promise<number> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('contributions')
    .select('transaction_id, notes')
    .not('transaction_id', 'is', null)
    .not('notes', 'is', null)

  if (error) {
    throw toError(error, 'Falha ao reparar observações das mensalidades.')
  }

  const notesByTransactionId: Record<string, string> = {}

  for (const row of data ?? []) {
    const transactionId = row.transaction_id as string | null
    if (!transactionId) continue

    const formatted = formatContributionNotesForFinancialTransaction(row.notes)
    if (!formatted) continue

    if (!notesByTransactionId[transactionId]) {
      notesByTransactionId[transactionId] = formatted
    } else if (!notesByTransactionId[transactionId].includes(formatted)) {
      notesByTransactionId[transactionId] = `${notesByTransactionId[transactionId]}\n${formatted}`
    }
  }

  let repaired = 0

  for (const [transactionId, notes] of Object.entries(notesByTransactionId)) {
    const { data: transaction, error: fetchError } = await supabaseAny
      .from('financial_transactions')
      .select('attachment_notes')
      .eq('id', transactionId)
      .maybeSingle()

    if (fetchError) throw toError(fetchError, 'Falha ao verificar receita da mensalidade.')
    if (transaction?.attachment_notes?.trim()) continue

    const { error: updateError } = await supabaseAny
      .from('financial_transactions')
      .update({ attachment_notes: notes })
      .eq('id', transactionId)

    if (updateError) throw toError(updateError, 'Falha ao gravar observação na receita.')
    repaired++
  }

  return repaired
}

export const CONTRIBUTION_MONTHS = [
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

export interface MembershipFeeSettings {
  defaultAmount: number
  dueDay: number
}

export const DEFAULT_MEMBERSHIP_AMOUNT = 150
export const DEFAULT_MEMBERSHIP_DUE_DAY = 10

export async function fetchMembershipFeeSettings(): Promise<MembershipFeeSettings> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('site_settings')
    .select('membership_fee_amount, membership_fee_due_day')
    .eq('id', 1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error

  return {
    defaultAmount: Number(data?.membership_fee_amount) || DEFAULT_MEMBERSHIP_AMOUNT,
    dueDay: Number(data?.membership_fee_due_day) || DEFAULT_MEMBERSHIP_DUE_DAY,
  }
}

/** Vincula cadastro da secretaria (brothers) ao usuário (profiles) pelo e-mail. */
export async function resolveProfileIdByEmail(
  email: string | null | undefined,
): Promise<string | null> {
  const normalized = email?.trim()
  if (!normalized) return null

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('profiles')
    .select('id')
    .ilike('email', normalized)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) throw error
  return data?.id ?? null
}

export async function fetchContributionsForProfile(
  profileId: string,
): Promise<Contribution[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('contributions')
    .select(`
      *,
      profiles!contributions_brother_id_fkey ( id, full_name )
    `)
    .eq('brother_id', profileId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((row: ContributionRow) => mapContributionRow(row))
}

export interface GenerateContributionsResult {
  created: number
  skipped: number
  totalBrothers: number
}

/** Cria mensalidades pendentes para todos os irmãos aprovados (ignora duplicatas). */
export async function generatePendingContributionsForMonth(
  month: number,
  year: number,
  amount?: number,
): Promise<GenerateContributionsResult> {
  if (isMembershipHistoricalPeriod(year, month)) {
    throw new Error(
      'Use o cronograma para regularizar meses anteriores a jun/2026 (somente controle).',
    )
  }

  const supabaseAny = supabase as any
  const settings = await fetchMembershipFeeSettings()
  const feeAmount = amount ?? settings.defaultAmount

  const brothers = await fetchApprovedBrothers()
  if (brothers.length === 0) {
    return { created: 0, skipped: 0, totalBrothers: 0 }
  }

  const { data: existing, error: existingError } = await supabaseAny
    .from('contributions')
    .select('brother_id')
    .eq('month', month)
    .eq('year', year)

  if (existingError) throw existingError

  const existingIds = new Set(
    (existing || []).map((r: { brother_id: string }) => r.brother_id),
  )

  const toInsert = brothers
    .filter((b) => !existingIds.has(b.id))
    .map((b) => ({
      brother_id: b.id,
      month,
      year,
      amount: feeAmount,
      status: 'Pendente' as const,
    }))

  if (toInsert.length > 0) {
    const { error } = await supabaseAny.from('contributions').insert(toInsert)
    if (error) throw error
  }

  return {
    created: toInsert.length,
    skipped: existingIds.size,
    totalBrothers: brothers.length,
  }
}

export interface ContributionFormData {
  brotherId: string
  brotherName?: string
  month: string
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  paymentDate?: string
  accountId?: string
  notes?: string
  treasuryMode?: ContributionTreasuryMode
  linkedTransactionId?: string
}

export interface LinkableMensalidadeTransaction {
  id: string
  date: string
  description: string
  amount: number
  accountId: string | null
  accountName?: string
  /** Indica se a descrição contém a referência MM/AAAA do mês lançado. */
  referenceMatch?: boolean
  referenceLabel?: string | null
}

export interface BrotherContributionSummary {
  brotherId: string
  brotherName: string
  totalPaid: number
  totalPending: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  currentStatus: 'paid' | 'pending' | 'upcoming' | 'overdue' | 'none'
  lastPaymentDate: string | null
}

interface ContributionRow {
  id: string
  brother_id: string
  month: number
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  payment_date: string | null
  transaction_id: string | null
  account_id: string | null
  notes: string | null
  profiles?: { id: string; full_name: string | null }
}

function monthNameToNumber(month: string): number {
  return CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
}

function monthNumberToName(month: number): string {
  return CONTRIBUTION_MONTHS[month - 1] ?? `${month}`
}

export function mapContributionRow(row: ContributionRow): Contribution {
  return {
    id: row.id,
    brotherId: row.brother_id,
    brotherName: row.profiles?.full_name ?? undefined,
    month: monthNumberToName(row.month),
    year: row.year,
    amount: Number(row.amount),
    status: row.status,
    paymentDate: row.payment_date ?? undefined,
    accountId: row.account_id ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    notes: row.notes ?? undefined,
  }
}

export function buildMensalidadeDescription(
  brotherName: string,
  month: number,
  year: number,
  paymentDate?: string,
): string {
  const name = brotherName.trim() || 'Irmão'
  const period = `${String(month).padStart(2, '0')}/${year}`
  if (paymentDate) {
    return `Mensalidade - ${name} (${period}) - ${paymentDate}`
  }
  return `Mensalidade - ${name} (${period})`
}

async function resolveMensalidadeCategoryId(
  supabaseAny: ReturnType<typeof supabase> & object,
): Promise<string> {
  const { data, error: fetchError } = await supabaseAny
    .from('financial_categories')
    .select('id')
    .eq('name', MENSALIDADE_CATEGORY)
    .eq('type', 'Receita')
    .maybeSingle()

  if (fetchError) throw fetchError
  if (data?.id) return data.id as string

  const { data: created, error: insertError } = await supabaseAny
    .from('financial_categories')
    .insert({
      name: MENSALIDADE_CATEGORY,
      type: 'Receita',
      description: 'Contribuições mensais dos irmãos',
      color: '#16a34a',
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return created.id as string
}

function formatSupabaseError(error: unknown): Error {
  return toError(error, 'Erro ao salvar mensalidade.')
}

async function syncFinancialTransaction(
  supabaseAny: ReturnType<typeof supabase> & object,
  params: {
    contributionId: string
    brotherName: string
    month: number
    year: number
    amount: number
    status: ContributionFormData['status']
    paymentDate?: string
    accountId?: string
    existingTransactionId?: string | null
    controlOnly?: boolean
    notes?: string | null
  },
): Promise<string | null> {
  const isPaid = params.status === 'Pago'
  const isHistorical = isMembershipHistoricalPeriod(params.year, params.month)
  const isBackfillOnly = isHistorical && isPaid && !params.accountId && !params.controlOnly

  if (isBackfillOnly) {
    if (params.existingTransactionId) {
      const { error } = await supabaseAny
        .from('financial_transactions')
        .delete()
        .eq('id', params.existingTransactionId)
      if (error) throw error
    }
    await supabaseAny
      .from('contributions')
      .update({ transaction_id: null, account_id: null })
      .eq('id', params.contributionId)
    return null
  }

  if (isPaid && params.controlOnly) {
    await supabaseAny
      .from('contributions')
      .update({ transaction_id: null, account_id: null })
      .eq('id', params.contributionId)
    return null
  }

  if (!isPaid) {
    if (params.existingTransactionId) {
      const { error } = await supabaseAny
        .from('financial_transactions')
        .delete()
        .eq('id', params.existingTransactionId)
      if (error) throw error
    }
    await supabaseAny
      .from('contributions')
      .update({ transaction_id: null })
      .eq('id', params.contributionId)
    return null
  }

  if (!params.accountId) {
    throw new Error('Selecione a conta bancária para registrar o pagamento.')
  }

  const paymentDate =
    params.paymentDate || todayLocalISODate()

  const categoryId = await resolveMensalidadeCategoryId(supabaseAny)

  const description = buildMensalidadeDescription(
    params.brotherName,
    params.month,
    params.year,
    paymentDate,
  )

  const attachmentNotes = formatContributionNotesForFinancialTransaction(params.notes)

  const payload = {
    date: paymentDate,
    description,
    category: MENSALIDADE_CATEGORY,
    category_id: categoryId,
    type: 'Receita' as const,
    amount: params.amount,
    account_id: params.accountId,
    attachment_notes: attachmentNotes,
  }

  if (params.existingTransactionId) {
    const { error } = await supabaseAny
      .from('financial_transactions')
      .update(payload)
      .eq('id', params.existingTransactionId)
    if (error) throw error

    await supabaseAny
      .from('contributions')
      .update({
        transaction_id: params.existingTransactionId,
        account_id: params.accountId,
      })
      .eq('id', params.contributionId)

    return params.existingTransactionId
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: created, error } = await supabaseAny
    .from('financial_transactions')
    .insert({
      ...payload,
      created_by: user?.id ?? null,
      idempotency_key:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : undefined,
    })
    .select('id')
    .single()

  if (error) throw error

  await supabaseAny
    .from('contributions')
    .update({
      transaction_id: created.id,
      account_id: params.accountId,
    })
    .eq('id', params.contributionId)

  return created.id as string
}

async function assertTransactionLinkable(
  supabaseAny: ReturnType<typeof supabase> & object,
  transactionId: string,
  excludeContributionId?: string,
): Promise<void> {
  let query = supabaseAny
    .from('contributions')
    .select('id')
    .eq('transaction_id', transactionId)

  if (excludeContributionId) {
    query = query.neq('id', excludeContributionId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (data) {
    throw new Error('Esta receita já está vinculada a outra mensalidade.')
  }
}

interface ContributionRepairRow {
  id: string
  brother_id: string
  month: number
  year: number
  amount: number
  status: ContributionFormData['status']
  payment_date: string | null
  account_id: string | null
  transaction_id: string | null
  notes: string | null
  profiles?: { full_name: string | null }
}

/** Corrige mensalidades pagas com conta, mas sem receita no caixa. */
export async function repairOrphanTreasuryContributions(): Promise<number> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('contributions')
    .select(`
      id,
      brother_id,
      month,
      year,
      amount,
      status,
      payment_date,
      account_id,
      transaction_id,
      notes,
      profiles!contributions_brother_id_fkey ( full_name )
    `)
    .eq('status', 'Pago')
    .not('account_id', 'is', null)
    .is('transaction_id', null)

  if (error) throw error

  let repaired = 0

  for (const row of (data ?? []) as ContributionRepairRow[]) {
    if (isMembershipHistoricalPeriod(row.year, row.month)) continue
    if (
      isMembershipBackfillContribution(row.year, row.month, {
        status: row.status,
        transactionId: row.transaction_id,
        accountId: row.account_id,
        notes: row.notes,
      })
    ) {
      continue
    }
    if (
      isMembershipControlOnlyContribution(row.year, row.month, {
        status: row.status,
        transactionId: row.transaction_id,
        accountId: row.account_id,
        notes: row.notes,
      })
    ) {
      continue
    }

    await syncFinancialTransaction(supabaseAny, {
      contributionId: row.id,
      brotherName: row.profiles?.full_name?.trim() || 'Irmão',
      month: row.month,
      year: row.year,
      amount: Number(row.amount),
      status: row.status,
      paymentDate: row.payment_date ?? undefined,
      accountId: row.account_id ?? undefined,
      existingTransactionId: null,
      notes: row.notes,
    })
    repaired++
  }

  return repaired
}

export async function fetchContributionsWithProfiles(): Promise<{
  contributions: Contribution[]
  brotherNames: Record<string, string>
}> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('contributions')
    .select(`
      *,
      profiles!contributions_brother_id_fkey ( id, full_name )
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  const brotherNames: Record<string, string> = {}
  const contributions = (data || []).map((row: ContributionRow) => {
    if (row.profiles?.full_name) {
      brotherNames[row.brother_id] = row.profiles.full_name
    }
    return mapContributionRow(row)
  })

  return { contributions, brotherNames }
}

export type ApprovedBrotherOption = {
  id: string
  full_name: string | null
  created_at?: string | null
}

/** Ordem alfabética pt-BR para listas de irmãos (mensalidades, ágape, etc.). */
export function sortBrothersAlphabetically<T extends ApprovedBrotherOption>(
  brothers: T[],
): T[] {
  return [...brothers].sort((a, b) =>
    (a.full_name?.trim() || 'Sem nome').localeCompare(
      b.full_name?.trim() || 'Sem nome',
      'pt-BR',
      { sensitivity: 'base' },
    ),
  )
}

export async function fetchApprovedBrothers(): Promise<ApprovedBrotherOption[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('status', 'approved')

  if (error) throw error
  return sortBrothersAlphabetically(data || [])
}

export async function fetchBankAccounts(): Promise<
  { id: string; name: string }[]
> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_accounts')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/** IDs de receitas já vinculadas a um mês no cronograma de mensalidades. */
export async function fetchLinkedMembershipTransactionIds(): Promise<Set<string>> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('contributions')
    .select('transaction_id')
    .not('transaction_id', 'is', null)

  if (error) throw error

  return new Set(
    (data ?? [])
      .map((row: { transaction_id: string | null }) => row.transaction_id)
      .filter(Boolean) as string[],
  )
}

/** Receitas de mensalidade ainda não vinculadas a um pagamento no cronograma. */
export async function fetchLinkableMensalidadeTransactions(params: {
  brotherName: string
  referenceMonth?: number
  referenceYear?: number
}): Promise<LinkableMensalidadeTransaction[]> {
  const supabaseAny = supabase as any
  const brotherName = params.brotherName.trim()
  if (!brotherName) return []

  const [{ data: transactions, error: txError }, linkedIds] = await Promise.all([
    supabaseAny
      .from('financial_transactions')
      .select('id, date, description, amount, account_id, financial_accounts(name)')
      .eq('type', 'Receita')
      .eq('category', MENSALIDADE_CATEGORY)
      .order('date', { ascending: false })
      .limit(200),
    fetchLinkedMembershipTransactionIds(),
  ])

  if (txError) throw txError

  const rows = (transactions ?? [])
    .filter((row: Record<string, unknown>) => {
      if (linkedIds.has(String(row.id))) return false
      const description = String(row.description ?? '')
      return mensalidadeDescriptionMatchesBrother(description, brotherName)
    })
    .map((row: Record<string, unknown>) => {
      const description = String(row.description ?? '')
      const reference = extractMensalidadeReferenceFromDescription(description)
      const referenceMatch = mensalidadeReferenceMatchesPeriod(
        description,
        params.referenceMonth,
        params.referenceYear,
      )

      return {
        id: String(row.id),
        date: String(row.date),
        description,
        amount: Number(row.amount),
        accountId: row.account_id ? String(row.account_id) : null,
        accountName: (row.financial_accounts as { name?: string } | null)?.name,
        referenceMatch,
        referenceLabel: reference?.label ?? null,
      }
    })

  return sortLinkableMensalidadeRows(rows)
}

export function buildBrotherSummaries(
  contributions: Contribution[],
  brotherNames: Record<string, string>,
  approvedBrothers: { id: string; full_name: string | null }[],
  dueDay: number = DEFAULT_MEMBERSHIP_DUE_DAY,
): BrotherContributionSummary[] {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const byBrother = new Map<string, Contribution[]>()
  for (const c of contributions) {
    const list = byBrother.get(c.brotherId) ?? []
    list.push(c)
    byBrother.set(c.brotherId, list)
  }

  const brotherIds = new Set([
    ...approvedBrothers.map((b) => b.id),
    ...contributions.map((c) => c.brotherId),
  ])

  return [...brotherIds]
    .map((brotherId) => {
      const items = byBrother.get(brotherId) ?? []
      const brotherName =
        brotherNames[brotherId] ||
        approvedBrothers.find((b) => b.id === brotherId)?.full_name ||
        'Sem nome'

      const paid = items.filter((i) => i.status === 'Pago')
      const pending = items.filter((i) => i.status !== 'Pago')

      const currentMonthItems = items.filter(
        (i) =>
          monthNameToNumber(i.month) === currentMonth && i.year === currentYear,
      )

      let currentStatus: BrotherContributionSummary['currentStatus'] = 'none'
      if (currentMonthItems.length > 0) {
        const hasUnpaid = currentMonthItems.some((i) => i.status !== 'Pago')
        if (!hasUnpaid) {
          currentStatus = 'paid'
        } else if (currentMonthItems.some((i) => i.status === 'Atrasado')) {
          currentStatus = 'overdue'
        } else {
          const dueIso = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(Math.min(dueDay, 28)).padStart(2, '0')}`
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          )
          const [dy, dm, dd] = dueIso.split('-').map(Number)
          const dueStart = new Date(dy, dm - 1, dd)
          if (todayStart.getTime() > dueStart.getTime()) {
            currentStatus = 'overdue'
          } else {
            currentStatus = 'upcoming'
          }
        }
      }

      const lastPaid = paid
        .slice()
        .sort((a, b) => {
          const da = a.paymentDate || `${a.year}-${monthNameToNumber(a.month)}`
          const db = b.paymentDate || `${b.year}-${monthNameToNumber(b.month)}`
          return db.localeCompare(da)
        })[0]

      return {
        brotherId,
        brotherName,
        totalPaid: paid.reduce((s, i) => s + i.amount, 0),
        totalPending: pending.reduce((s, i) => s + i.amount, 0),
        paidCount: paid.length,
        pendingCount: pending.filter((i) => i.status === 'Pendente').length,
        overdueCount: pending.filter((i) => i.status === 'Atrasado').length,
        currentStatus,
        lastPaymentDate: lastPaid?.paymentDate ?? null,
      }
    })
    .sort((a, b) => a.brotherName.localeCompare(b.brotherName, 'pt-BR'))
}

export async function saveContribution(
  data: ContributionFormData,
  options?: {
    contributionId?: string
    existingTransactionId?: string | null
    /** Vincula a uma receita já criada (ex.: pagamento único de vários meses). */
    sharedTransactionId?: string | null
  },
): Promise<void> {
  const supabaseAny = supabase as any
  const month = monthNameToNumber(data.month)
  const brotherName = data.brotherName?.trim() || 'Irmão'
  const treasuryMode = data.treasuryMode ?? 'standard'
  const isControlOnly =
    treasuryMode === 'control_only' && data.status === 'Pago'
  const linkedTransactionId =
    treasuryMode === 'link_existing' &&
    data.status === 'Pago' &&
    data.linkedTransactionId
      ? data.linkedTransactionId
      : null

  let linkedAccountId: string | null = null
  if (linkedTransactionId) {
    await assertTransactionLinkable(
      supabaseAny,
      linkedTransactionId,
      options?.contributionId,
    )
    const { data: linkedTx, error: linkedError } = await supabaseAny
      .from('financial_transactions')
      .select('account_id')
      .eq('id', linkedTransactionId)
      .single()
    if (linkedError) throw formatSupabaseError(linkedError)
    linkedAccountId = linkedTx?.account_id ?? null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const basePayload = {
    brother_id: data.brotherId,
    month,
    year: data.year,
    amount: data.amount,
    status: data.status,
    payment_date:
      data.status === 'Pago'
        ? data.paymentDate || todayLocalISODate()
        : null,
    account_id:
      data.status === 'Pago'
        ? isControlOnly
          ? null
          : linkedTransactionId
            ? linkedAccountId
            : data.accountId ?? null
        : null,
    notes: isControlOnly
      ? buildControlOnlyNotes(data.notes)
      : data.notes?.trim() || null,
    recorded_by: user?.id ?? null,
  }

  const persistAndSync = async (
    contributionId: string,
    existingTransactionId?: string | null,
  ) => {
    const sharedTransactionId =
      options?.sharedTransactionId ?? linkedTransactionId

    if (sharedTransactionId && data.status === 'Pago') {
      if (
        existingTransactionId &&
        existingTransactionId !== sharedTransactionId
      ) {
        const { error: deleteError } = await supabaseAny
          .from('financial_transactions')
          .delete()
          .eq('id', existingTransactionId)
        if (deleteError) throw deleteError
      }

      const attachmentNotes = formatContributionNotesForFinancialTransaction(
        basePayload.notes,
      )
      if (attachmentNotes) {
        const { error: notesError } = await supabaseAny
          .from('financial_transactions')
          .update({ attachment_notes: attachmentNotes })
          .eq('id', sharedTransactionId)
        if (notesError) throw notesError
      }

      const { error: linkError } = await supabaseAny
        .from('contributions')
        .update({
          transaction_id: sharedTransactionId,
          account_id: linkedAccountId ?? data.accountId ?? null,
        })
        .eq('id', contributionId)
      if (linkError) throw linkError
      return
    }

    if (isControlOnly) {
      await syncFinancialTransaction(supabaseAny, {
        contributionId,
        brotherName,
        month,
        year: data.year,
        amount: data.amount,
        status: data.status,
        controlOnly: true,
      })
      return
    }

    await syncFinancialTransaction(supabaseAny, {
      contributionId,
      brotherName,
      month,
      year: data.year,
      amount: data.amount,
      status: data.status,
      paymentDate: basePayload.payment_date ?? undefined,
      accountId: data.accountId,
      existingTransactionId,
      notes: basePayload.notes,
    })
  }

  if (options?.contributionId) {
    const { data: previous, error: previousError } = await supabaseAny
      .from('contributions')
      .select(
        'brother_id, month, year, amount, status, payment_date, account_id, notes, recorded_by',
      )
      .eq('id', options.contributionId)
      .single()

    if (previousError) throw formatSupabaseError(previousError)

    const { error } = await supabaseAny
      .from('contributions')
      .update(basePayload)
      .eq('id', options.contributionId)
    if (error) throw formatSupabaseError(error)

    try {
      await persistAndSync(options.contributionId, options.existingTransactionId)
    } catch (syncError) {
      const { error: rollbackError } = await supabaseAny
        .from('contributions')
        .update(previous)
        .eq('id', options.contributionId)

      if (rollbackError) {
        throw formatSupabaseError(
          new Error(
            'Falha ao sincronizar a tesouraria e ao reverter a mensalidade. Recarregue a página e tente novamente.',
          ),
        )
      }

      throw formatSupabaseError(syncError)
    }
    return
  }

  const { data: created, error } = await supabaseAny
    .from('contributions')
    .insert(basePayload)
    .select('id, transaction_id')
    .single()

  if (error) throw formatSupabaseError(error)

  try {
    await persistAndSync(created.id, created.transaction_id)
  } catch (syncError) {
    await supabaseAny.from('contributions').delete().eq('id', created.id)
    throw formatSupabaseError(syncError)
  }
}

export async function deleteContribution(contribution: Contribution): Promise<void> {
  const supabaseAny = supabase as any

  if (contribution.transactionId) {
    const { error: txError } = await supabaseAny
      .from('financial_transactions')
      .delete()
      .eq('id', contribution.transactionId)
    if (txError) throw txError
  }

  const { error } = await supabaseAny
    .from('contributions')
    .delete()
    .eq('id', contribution.id)

  if (error) throw error
}

export function filterContributionsByBrother(
  contributions: Contribution[],
  brotherId: string,
): Contribution[] {
  return contributions.filter((c) => c.brotherId === brotherId)
}

export { monthNameToNumber, monthNumberToName }
