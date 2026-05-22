import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

async function parseFunctionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context) {
    try {
      const body = (await error.context.json()) as { error?: string }
      if (body?.error) return body.error
    } catch {
      // ignore parse errors
    }
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export async function deleteUserAsAdmin(userId: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Faça login como administrador para continuar.')
  }

  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId },
  })

  if (error) {
    throw new Error(
      await parseFunctionErrorMessage(
        error,
        'Não foi possível excluir o usuário. Verifique se está logado como administrador.',
      ),
    )
  }

  const payload = data as { error?: string; success?: boolean } | null
  if (payload?.error) {
    throw new Error(payload.error)
  }
}
