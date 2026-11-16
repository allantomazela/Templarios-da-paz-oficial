import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { withTimeout } from '@/lib/async-utils'

const DELETE_TIMEOUT_MS = 25_000
const CREDENTIALS_TIMEOUT_MS = 25_000

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

async function requireLoggedInUser(): Promise<{
  id: string
  email: string
}> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Faça login para continuar.')
  }
  const email = user.email?.trim()
  if (!email) {
    throw new Error('Sua conta de administrador está sem e-mail.')
  }
  return { id: user.id, email }
}

/**
 * Revalida a senha do admin na sessão atual (não desloga o painel).
 * A Edge Function ainda confirma a senha no servidor com logout local.
 */
async function confirmAdminPassword(adminPassword: string): Promise<void> {
  const password = adminPassword?.trim()
  if (!password) {
    throw new Error('Informe a sua senha de administrador para confirmar.')
  }

  const { email } = await requireLoggedInUser()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error('Senha do administrador incorreta.')
  }
}

async function deleteMember(payload: DeleteMemberPayload): Promise<void> {
  await requireLoggedInUser()

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
  await requireLoggedInUser()

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

export async function setUserPasswordAsAdmin(params: {
  userId: string
  adminPassword: string
  newPassword: string
  forcePasswordChange?: boolean
}): Promise<{ forcePasswordChange: boolean }> {
  await confirmAdminPassword(params.adminPassword)

  const userId = params.userId?.trim()
  if (!userId) throw new Error('ID do usuário não informado.')

  const { data, error } = await withTimeout(
    supabase.functions.invoke('admin-manage-credentials', {
      body: {
        action: 'set_password',
        userId,
        adminPassword: params.adminPassword,
        newPassword: params.newPassword,
        forcePasswordChange: params.forcePasswordChange ?? true,
      },
    }),
    CREDENTIALS_TIMEOUT_MS,
    'A alteração de senha demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw new Error(
      await parseInvokeError(
        error,
        'Não foi possível alterar a senha. Confirme se a Edge Function está publicada.',
      ),
    )
  }

  const response = data as {
    error?: string
    success?: boolean
    forcePasswordChange?: boolean
  } | null
  if (response?.error) throw new Error(response.error)

  return { forcePasswordChange: response?.forcePasswordChange !== false }
}

export async function changeUserEmailAsAdmin(params: {
  userId: string
  adminPassword: string
  newEmail: string
}): Promise<{ email: string; previousEmail: string | null }> {
  await confirmAdminPassword(params.adminPassword)

  const userId = params.userId?.trim()
  if (!userId) throw new Error('ID do usuário não informado.')

  const { data, error } = await withTimeout(
    supabase.functions.invoke('admin-manage-credentials', {
      body: {
        action: 'change_email',
        userId,
        adminPassword: params.adminPassword,
        newEmail: params.newEmail,
      },
    }),
    CREDENTIALS_TIMEOUT_MS,
    'A alteração de e-mail demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw new Error(
      await parseInvokeError(
        error,
        'Não foi possível alterar o e-mail. Confirme se a Edge Function está publicada.',
      ),
    )
  }

  const response = data as {
    error?: string
    success?: boolean
    email?: string
    previousEmail?: string | null
  } | null
  if (response?.error) throw new Error(response.error)
  if (!response?.email) throw new Error('Resposta inválida do servidor.')

  return {
    email: response.email,
    previousEmail: response.previousEmail ?? null,
  }
}

/** Gera senha provisória legível (sem caracteres ambíguos). */
export function generateProvisionalPassword(length = 12): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$'
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += alphabet[values[i]! % alphabet.length]!
  }
  // Garante regras mínimas mesmo com sorteio aleatório.
  if (!/[a-z]/.test(result)) result = `a${result.slice(1)}`
  if (!/[A-Z]/.test(result)) result = `A${result.slice(1)}`
  if (!/\d/.test(result)) result = `${result.slice(0, -1)}7`
  return result
}
