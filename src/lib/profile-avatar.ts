/** URLs geradas automaticamente (ex.: placeholders antigos) não devem ser exibidas como foto do usuário. */
const BLOCKED_AVATAR_HOSTS = ['usecurling.com']

/**
 * Retorna URL de avatar válida para exibição ou `undefined` para usar fallback (iniciais/ícone).
 */
export function resolveProfileAvatarUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim()
  if (!trimmed) return undefined
  if (BLOCKED_AVATAR_HOSTS.some((host) => trimmed.includes(host))) {
    return undefined
  }
  return trimmed
}

export function sanitizeAuthProfile<T extends { avatar_url?: string | null }>(
  profile: T,
): T {
  return {
    ...profile,
    avatar_url: resolveProfileAvatarUrl(profile.avatar_url),
  }
}

export function getProfileInitials(name?: string | null): string {
  const parts = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return 'U'
  return parts
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
