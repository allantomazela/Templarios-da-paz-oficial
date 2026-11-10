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
  const id = userId?.trim()
  if (!id) {
    throw new Error('ID do usuário não informado.')
  }
  await deleteMember({ userId: id })
}

export async function deleteBrotherAsAdmin(brotherId: string): Promise<void> {
  const id = brotherId?.trim()
  if (!id) {
    throw new Error('ID do irmão não informado.')
  }
  await deleteMember({ brotherId: id })
}

export interface CreatePreInitiationUserInput {
  fullName: string
  email: string
  password: string
  phone?: string
}

export interface CreatePreInitiationUserResult {
  userId: string
  email: string
  fullName: string
}

/** Cria conta já em pré-iniciação (admin). A senha fica só com quem cadastrou. */
export async function createPreInitiationUserAsAdmin(
  input: CreatePreInitiationUserInput,
): Promise<CreatePreInitiationUserResult> {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Faça login para continuar.')
  }

  const { data, error } = await withTimeout(
    supabase.functions.invoke('admin-create-pre-initiation-user', {
      body: {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        phone: input.phone?.trim() || undefined,
      },
    }),
    DELETE_TIMEOUT_MS,
    'A criação demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw new Error(
      await parseInvokeError(error, 'Não foi possível criar o iniciando.'),
    )
  }

  const response = data as
    | (CreatePreInitiationUserResult & { error?: string; success?: boolean })
    | null

  if (response?.error) {
    throw new Error(response.error)
  }

  if (!response?.userId || !response.email) {
    throw new Error('Resposta inválida ao criar o iniciando.')
  }

  return {
    userId: response.userId,
    email: response.email,
    fullName: response.fullName || input.fullName,
  }
}
