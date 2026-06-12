import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { withTimeout } from '@/lib/async-utils'

const DELETE_TIMEOUT_MS = 25_000

interface DeleteMemberPayload {
  userId?: string
  brotherId?: string
}

async function parseInvokeError(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context) {
    try {
      const body = (await error.context.json()) as { error?: string }
      if (body?.error) return body.error
    } catch {
      // ignore
    }
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

async function deleteMember(payload: DeleteMemberPayload): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Faça login para continuar.')
  }

  const invokePromise = supabase.functions.invoke('admin-delete-user', {
    body: payload,
  })

  const { data, error } = await withTimeout(
    invokePromise,
    DELETE_TIMEOUT_MS,
    'A exclusão demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw new Error(
      await parseInvokeError(
        error,
        'Não foi possível concluir a exclusão. Faça login novamente.',
      ),
    )
  }

  const response = data as { error?: string; success?: boolean } | null
  if (response?.error) {
    throw new Error(response.error)
  }
}

export async function deleteUserAsAdmin(userId: string): Promise<void> {
  await deleteMember({ userId })
}

export async function deleteBrotherAsAdmin(brotherId: string): Promise<void> {
  await deleteMember({ brotherId })
}
