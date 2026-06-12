import { isMasterAdminEmail } from '@/config/master-admin'
import type { Profile } from '@/stores/useAuthStore'

type LodgeAccessUser = {
  email?: string | null
  role?: string | null
  profile?: Pick<Profile, 'status' | 'role'> | null
} | null

/** Galeria de veneráveis: apenas membros aprovados da loja (ou equipe). */
export function canViewVenerablesGallery(user: LodgeAccessUser): boolean {
  if (!user) return false
  if (isMasterAdminEmail(user.email)) return true

  const role = user.profile?.role ?? user.role
  if (role === 'admin' || role === 'editor') return true

  return user.profile?.status === 'approved'
}
