import type { Brother } from '@/lib/data'
import type { Profile } from '@/stores/useAuthStore'
import { formatPhone, todayLocalISODate } from '@/lib/format-utils'
import { resolveProfileAvatarUrl } from '@/lib/profile-avatar'

const PLACEHOLDER_PHONE = 'não informado'

function normalizeDegree(
  degree?: string | null,
): Brother['degree'] {
  if (degree === 'Companheiro' || degree === 'Mestre') return degree
  return 'Aprendiz'
}

export function normalizeBrotherPhoneForForm(phone?: string | null): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  if (!trimmed || trimmed.toLowerCase() === PLACEHOLDER_PHONE) return ''
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length >= 10) return formatPhone(trimmed)
  return trimmed
}

/** Foto do cadastro na secretaria sempre segue o avatar do perfil. */
export function resolveBrotherPhotoFromProfile(
  profileAvatarUrl?: string | null,
  brotherPhotoUrl?: string | null,
): string | undefined {
  return (
    resolveProfileAvatarUrl(profileAvatarUrl) ??
    resolveProfileAvatarUrl(brotherPhotoUrl)
  )
}

export function buildBrotherDraftFromProfile(profile: Profile): Brother {
  const today = todayLocalISODate()

  return {
    id: '',
    name: profile.full_name?.trim() || '',
    email: profile.email?.trim() || '',
    phone: '',
    profileId: profile.id,
    degree: normalizeDegree(profile.masonic_degree),
    role: 'Irmão',
    status: 'Ativo',
    initiationDate: today,
    attendanceRate: 0,
    photoUrl: resolveBrotherPhotoFromProfile(profile.avatar_url),
  }
}

export function isBrotherRegistrationComplete(brother: Brother | null): boolean {
  if (!brother) return false

  const phone = brother.phone?.trim()
  if (!phone || phone.toLowerCase() === PLACEHOLDER_PHONE) return false
  if (!brother.dob?.trim()) return false
  if (!brother.initiationDate?.trim()) return false
  if (!brother.name?.trim() || brother.name.trim().length < 3) return false

  return true
}
