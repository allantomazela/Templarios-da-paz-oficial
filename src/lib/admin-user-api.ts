import { supabase } from '@/lib/supabase/client'
import { withTimeout } from '@/lib/async-utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
const DELETE_TIMEOUT_MS = 25_000

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) return session.access_token

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Faça login como administrador para continuar.')
  }

  const { data: { session: retry } } = await supabase.auth.getSession()
  if (!retry?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  return retry.access_token
}

export async function deleteUserAsAdmin(userId: string): Promise<void> {
  const accessToken = await getAccessToken()

  const fetchPromise = fetch(`${SUPABASE_URL}/functions/v1/admin-delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ userId }),
  })

  const res = await withTimeout(
    fetchPromise,
    DELETE_TIMEOUT_MS,
    'A exclusão demorou demais. Verifique sua conexão e tente novamente.',
  )

  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    success?: boolean
  }

  if (!res.ok) {
    const msg =
      data.error ||
      (res.status === 401
        ? 'Não autorizado. Confirme que você está logado como administrador.'
        : res.status === 403
          ? 'Sem permissão para excluir usuários.'
          : 'Não foi possível excluir o usuário.')
    throw new Error(msg)
  }

  if (data.error) {
    throw new Error(data.error)
  }
}
