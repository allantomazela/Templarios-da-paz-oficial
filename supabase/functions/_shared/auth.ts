import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

export type AuthedUserClient =
  | {
      ok: true
      user: NonNullable<
        Awaited<
          ReturnType<
            ReturnType<typeof createClient>['auth']['getUser']
          >
        >['data']['user']
      >
      /** Cliente autenticado com o JWT do usuário (RLS / Storage aplicam). */
      userClient: ReturnType<typeof createClient>
    }
  | { ok: false; status: number; message: string }

/**
 * Valida Bearer JWT e exige papel admin ou editor (RPC alinhada às políticas RLS).
 */
export async function requireAdminOrEditor(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authHeader: string | null,
): Promise<AuthedUserClient> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Não autorizado.' }
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return { ok: false, status: 401, message: 'Sessão inválida.' }
  }

  const { data: allowed, error: rpcError } = await userClient.rpc(
    'is_admin_or_editor',
  )

  if (rpcError || !allowed) {
    return { ok: false, status: 403, message: 'Sem permissão para esta ação.' }
  }

  return { ok: true, user, userClient }
}

/**
 * Valida Bearer JWT (qualquer usuário autenticado).
 */
export async function requireAuthenticatedUser(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authHeader: string | null,
): Promise<AuthedUserClient> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Não autorizado.' }
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return { ok: false, status: 401, message: 'Sessão inválida.' }
  }

  return { ok: true, user, userClient }
}

/**
 * Valida Bearer JWT e exige papel admin (RPC is_admin).
 */
export async function requireAdmin(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authHeader: string | null,
): Promise<AuthedUserClient> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Não autorizado.' }
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return { ok: false, status: 401, message: 'Sessão inválida.' }
  }

  const { data: allowed, error: rpcError } = await userClient.rpc('is_admin')

  if (rpcError || !allowed) {
    return {
      ok: false,
      status: 403,
      message: 'Apenas administradores podem executar esta ação.',
    }
  }

  return { ok: true, user, userClient }
}
