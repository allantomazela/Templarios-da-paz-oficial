import { supabase } from '@/lib/supabase/client'
import { resolveProfileIdByEmail } from '@/lib/contribution-payments'

export { resolveProfileIdByEmail }

export const BROTHER_PROFILE_AUTO = '__auto__'
export const BROTHER_PROFILE_NONE = '__none__'

/** Resolve profile_id ao salvar irmão: manual > auto por e-mail > sem vínculo */
export async function resolveBrotherProfileIdForSave(
  email: string,
  explicitProfileId?: string | null,
): Promise<string | null> {
  if (explicitProfileId === BROTHER_PROFILE_NONE) {
    return null
  }
  if (
    explicitProfileId &&
    explicitProfileId !== BROTHER_PROFILE_AUTO
  ) {
    return explicitProfileId
  }
  return resolveProfileIdByEmail(email)
}

export async function fetchApprovedProfilesForLink(): Promise<
  { id: string; full_name: string | null; email: string | null }[]
> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('profiles')
    .select('id, full_name, email')
    .eq('status', 'approved')
    .order('full_name', { ascending: true })

  if (error) throw error
  return data || []
}

export function profileLinkLabel(
  profile: { full_name: string | null; email: string | null },
): string {
  const name = profile.full_name?.trim() || 'Sem nome'
  const email = profile.email?.trim()
  return email ? `${name} (${email})` : name
}
