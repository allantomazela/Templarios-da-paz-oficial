import { supabase } from '@/lib/supabase/client'
import { logError, logWarning } from '@/lib/logger'
import useAuthStore from '@/stores/useAuthStore'
import { normalizeMasonicDegree } from '@/lib/masonic-degree'

/**
 * Mantém profiles.masonic_degree alinhado ao grau em brothers (Secretaria).
 * A Biblioteca prioriza brothers, mas outros módulos ainda leem o perfil.
 */
export async function syncProfileMasonicDegreeFromBrother(
  email: string | undefined | null,
  degree: string | undefined | null,
): Promise<void> {
  const normalizedEmail = email?.trim()
  const normalizedDegree = normalizeMasonicDegree(degree)
  if (!normalizedEmail || !normalizedDegree) return

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ masonic_degree: normalizedDegree })
      .ilike('email', normalizedEmail)
      .select('id')

    if (error) {
      logWarning('Não foi possível sincronizar grau no perfil', error)
      return
    }

    if (!data?.length) return

    const sessionEmail = useAuthStore.getState().user?.email?.trim().toLowerCase()
    if (sessionEmail && sessionEmail === normalizedEmail.toLowerCase()) {
      useAuthStore.setState((state) => {
        if (!state.user?.profile) return state
        return {
          user: {
            ...state.user,
            profile: {
              ...state.user.profile,
              masonic_degree: normalizedDegree,
            },
          },
        }
      })
    }
  } catch (error) {
    logError('Erro ao sincronizar grau maçônico no perfil', error)
  }
}
