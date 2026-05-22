import { supabase } from '@/lib/supabase/client'

export async function deleteUserAsAdmin(userId: string): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Faça login como administrador para continuar.')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || 'Não foi possível excluir o usuário.',
    )
  }
}
