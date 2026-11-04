import { supabase } from '@/lib/supabase/client'
import {
  inferMembershipSituation,
  isBrotherBillable,
  type MembershipSituation,
} from '@/lib/brother-membership-situation'

export type ApprovedBrotherOption = {
  id: string
  full_name: string | null
  created_at?: string | null
  membershipSituation?: MembershipSituation | null
  membershipDuesStartDate?: string | null
}

export interface BillableBrotherOption {
  id: string
  full_name: string | null
  situation: MembershipSituation
  membershipDuesStartDate?: string | null
}

interface BrotherSituationColumns {
  status?: string | null
  regular_status?: string | null
  membership_situation?: string | null
}

function situationFromBrotherRow(
  row: BrotherSituationColumns | null | undefined,
): MembershipSituation {
  return inferMembershipSituation({
    status: (row?.status as 'Ativo' | 'Inativo') || 'Ativo',
    regularStatus: row?.regular_status ? String(row.regular_status) : undefined,
    membershipSituation: row?.membership_situation
      ? (String(row.membership_situation) as MembershipSituation)
      : undefined,
  })
}

/** Vincula cadastro da secretaria (brothers) ao usuário (profiles) pelo e-mail. */
export async function resolveProfileIdByEmail(
  email: string | null | undefined,
): Promise<string | null> {
  const normalized = email?.trim()
  if (!normalized) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', normalized)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) throw error
  return data?.id ?? null
}

/** Irmãos aprovados com situação de cobrança (exclui desligados). */
export async function fetchBillableBrothers(): Promise<BillableBrotherOption[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('status', 'approved')

  if (error) throw error
  const approved = (profiles || []) as { id: string; full_name: string | null }[]
  if (approved.length === 0) return []

  const ids = approved.map((p) => p.id)
  const { data: brothers, error: brothersError } = await supabase
    .from('brothers')
    .select(
      'profile_id, status, regular_status, membership_situation, membership_dues_start_date',
    )
    .in('profile_id', ids)

  if (brothersError) throw brothersError

  const byProfile = new Map(
    ((brothers || []) as Array<Record<string, unknown>>).map((row) => [
      String(row.profile_id),
      {
        situation: situationFromBrotherRow({
          status: row.status as string | null,
          regular_status: row.regular_status as string | null,
          membership_situation: row.membership_situation as string | null,
        }),
        membershipDuesStartDate: row.membership_dues_start_date
          ? String(row.membership_dues_start_date)
          : null,
      },
    ]),
  )

  return approved
    .map((profile) => {
      const linked = byProfile.get(profile.id)
      return {
        id: profile.id,
        full_name: profile.full_name,
        situation: linked?.situation ?? ('regular' as MembershipSituation),
        membershipDuesStartDate: linked?.membershipDuesStartDate ?? null,
      }
    })
    .filter((brother) => isBrotherBillable(brother.situation))
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
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, created_at, brothers!brothers_profile_id_fkey(status, regular_status, membership_situation, membership_dues_start_date)',
    )
    .eq('status', 'approved')

  if (error) throw error

  const approved = (data || []) as Array<{
    id: string
    full_name: string | null
    created_at: string
    brothers?:
      | (BrotherSituationColumns & {
          membership_dues_start_date?: string | null
        })
      | (BrotherSituationColumns & {
          membership_dues_start_date?: string | null
        })[]
      | null
  }>

  return sortBrothersAlphabetically(
    approved.map((row) => {
      const brotherRow = Array.isArray(row.brothers)
        ? row.brothers[0]
        : row.brothers
      return {
        id: row.id,
        full_name: row.full_name,
        created_at: row.created_at,
        membershipSituation: situationFromBrotherRow(brotherRow),
        membershipDuesStartDate: brotherRow?.membership_dues_start_date
          ? String(brotherRow.membership_dues_start_date)
          : null,
      }
    }),
  )
}
