import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import {
  resolveEffectiveMasonicDegree,
  type MasonicDegree,
} from '@/lib/masonic-degree'

/**
 * Grau maçônico para controle de acesso: lê brothers (Secretaria) por e-mail
 * e complementa com profiles.masonic_degree.
 */
export function useEffectiveMasonicDegree() {
  const email = useAuthStore((s) => s.user?.email)
  const profileDegree = useAuthStore((s) => s.user?.profile?.masonic_degree)
  const [brotherDegree, setBrotherDegree] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const normalizedEmail = email?.trim()
    if (!normalizedEmail) {
      setBrotherDegree(undefined)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('brothers')
        .select('degree')
        .ilike('email', normalizedEmail)
        .maybeSingle()

      if (error) throw error
      setBrotherDegree(data?.degree ?? undefined)
    } catch {
      setBrotherDegree(undefined)
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onFocus = () => {
      void refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const effectiveDegree: MasonicDegree | undefined = resolveEffectiveMasonicDegree(
    brotherDegree,
    profileDegree,
  )

  return {
    effectiveDegree,
    brotherDegree,
    profileDegree,
    loading,
    refresh,
  }
}
