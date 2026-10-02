import { supabase } from '@/lib/supabase/client'
import type { Contribution } from '@/lib/data'
import {
  extractMensalidadeReferenceFromDescription,
  mensalidadeDescriptionMatchesBrother,
  mensalidadeReferenceMatchesPeriod,
  sortLinkableMensalidadeRows,
} from '@/lib/membership-control-only'
import {
  MENSALIDADE_CATEGORY,
  mapContributionRow,
  type ContributionRow,
} from '@/lib/contribution-mappers'

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

const CONTRIBUTION_WITH_PROFILE_SELECT = `
      *,
      profiles!contributions_brother_id_fkey ( id, full_name )
    `

export async function fetchContributionsForProfile(
  profileId: string,
): Promise<Contribution[]> {
  const { data, error } = await supabase
    .from('contributions')
    .select(CONTRIBUTION_WITH_PROFILE_SELECT)
    .eq('brother_id', profileId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((row: ContributionRow) => mapContributionRow(row))
}

export async function fetchContributionsWithProfiles(): Promise<{
  contributions: Contribution[]
  brotherNames: Record<string, string>
}> {
  const { data, error } = await supabase
    .from('contributions')
    .select(CONTRIBUTION_WITH_PROFILE_SELECT)
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

export async function fetchBankAccounts(): Promise<
  { id: string; name: string }[]
> {
  const { data, error } = await supabase
    .from('financial_accounts')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

/** IDs de receitas já vinculadas a um mês no cronograma de mensalidades. */
export async function fetchLinkedMembershipTransactionIds(): Promise<Set<string>> {
  const { data, error } = await supabase
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
  const brotherName = params.brotherName.trim()
  if (!brotherName) return []

  const [{ data: transactions, error: txError }, linkedIds] = await Promise.all([
    supabase
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

export function filterContributionsByBrother(
  contributions: Contribution[],
  brotherId: string,
): Contribution[] {
  return contributions.filter((c) => c.brotherId === brotherId)
}
