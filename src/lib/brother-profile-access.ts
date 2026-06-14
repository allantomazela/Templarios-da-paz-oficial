import { supabase } from '@/lib/supabase/client'
import {
  LODGE_POSITION_LABELS,
  SYSTEM_ROLE_LABELS,
  type LodgePositionType,
} from '@/constants/lodgePositions'

export type SystemRole = 'admin' | 'editor' | 'member'

export interface BrotherAccessInfo {
  profileId: string
  fullName: string | null
  email: string | null
  systemRole: SystemRole | null
  lodgePositions: LodgePositionType[]
  isTreasurer: boolean
  isSystemAdmin: boolean
  isFinancialStaff: boolean
}

export interface FinancialAccessMember {
  profileId: string
  fullName: string
  email: string | null
  systemRole: SystemRole | null
  lodgePositions: LodgePositionType[]
  brotherId: string | null
}

export async function fetchBrotherAccessInfo(
  profileId: string | null | undefined,
): Promise<BrotherAccessInfo | null> {
  if (!profileId?.trim()) return null

  const supabaseAny = supabase as any
  const [{ data: profile, error: profileError }, { data: positions, error: positionsError }] =
    await Promise.all([
      supabaseAny
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', profileId)
        .maybeSingle(),
      supabaseAny
        .from('lodge_positions')
        .select('position_type, user_id')
        .eq('user_id', profileId),
    ])

  if (profileError) throw profileError
  if (positionsError) throw positionsError
  if (!profile) return null

  const systemRole = (profile.role as SystemRole | null) ?? null
  const lodgePositions = (positions || []).map(
    (p: { position_type: LodgePositionType }) => p.position_type,
  )

  return {
    profileId: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    systemRole,
    lodgePositions,
    isTreasurer: lodgePositions.includes('tesoureiro'),
    isSystemAdmin: systemRole === 'admin',
    isFinancialStaff:
      systemRole === 'admin' ||
      systemRole === 'editor' ||
      lodgePositions.includes('tesoureiro'),
  }
}

export async function fetchFinancialAccessMembers(): Promise<
  FinancialAccessMember[]
> {
  const supabaseAny = supabase as any
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: profiles, error: profilesError }, { data: positions, error: positionsError }, { data: brothers, error: brothersError }] =
    await Promise.all([
      supabaseAny
        .from('profiles')
        .select('id, full_name, email, role, status')
        .eq('status', 'approved')
        .in('role', ['admin', 'editor']),
      supabaseAny
        .from('lodge_positions')
        .select('position_type, user_id, start_date, end_date')
        .eq('position_type', 'tesoureiro'),
      supabaseAny.from('brothers').select('id, profile_id, email'),
    ])

  if (profilesError) throw profilesError
  if (positionsError) throw positionsError
  if (brothersError) throw brothersError

  const brotherByProfile = new Map<string, string>()
  for (const b of brothers || []) {
    if (b.profile_id) brotherByProfile.set(b.profile_id, b.id)
  }

  const positionsByUser = new Map<string, LodgePositionType[]>()
  for (const p of positions || []) {
    if (!p.user_id) continue
    if (p.end_date && p.end_date < today) continue
    if (p.start_date && p.start_date > today) continue
    const list = positionsByUser.get(p.user_id) ?? []
    list.push(p.position_type as LodgePositionType)
    positionsByUser.set(p.user_id, list)
  }

  const byProfile = new Map<string, FinancialAccessMember>()

  for (const profile of profiles || []) {
    byProfile.set(profile.id, {
      profileId: profile.id,
      fullName: profile.full_name?.trim() || 'Sem nome',
      email: profile.email,
      systemRole: profile.role as SystemRole,
      lodgePositions: positionsByUser.get(profile.id) ?? [],
      brotherId: brotherByProfile.get(profile.id) ?? null,
    })
  }

  const missingTreasurerIds = [...positionsByUser.keys()].filter(
    (id) => !byProfile.has(id),
  )

  if (missingTreasurerIds.length > 0) {
    const { data: extraProfiles, error: extraError } = await supabaseAny
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', missingTreasurerIds)

    if (extraError) throw extraError

    for (const profile of extraProfiles || []) {
      byProfile.set(profile.id, {
        profileId: profile.id,
        fullName: profile.full_name?.trim() || 'Sem nome',
        email: profile.email,
        systemRole: profile.role as SystemRole,
        lodgePositions: positionsByUser.get(profile.id) ?? [],
        brotherId: brotherByProfile.get(profile.id) ?? null,
      })
    }
  }

  for (const [userId, lodgePositions] of positionsByUser) {
    const existing = byProfile.get(userId)
    if (!existing) continue
    existing.lodgePositions = [
      ...new Set([...existing.lodgePositions, ...lodgePositions]),
    ]
  }

  return [...byProfile.values()].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'pt-BR'),
  )
}

export function formatSystemRoleLabel(role: SystemRole | null): string {
  if (!role) return 'Sem papel'
  return SYSTEM_ROLE_LABELS[role]
}

export function formatLodgePositionLabel(position: LodgePositionType): string {
  return LODGE_POSITION_LABELS[position]
}
