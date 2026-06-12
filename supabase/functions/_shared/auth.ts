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

const MASTER_ADMIN_EMAIL = 'allantomazela@gmail.com'

type AuthUser = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof createClient>['auth']['getUser']>
  >['data']['user']
>

/**
 * Valida Bearer JWT e exige papel admin ou editor (RPC alinhada às políticas RLS).
 * Com serviceRoleKey, valida o JWT via Auth Admin (compatível com JWT assimétrico).
 */
export async function requireAdminOrEditor(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authHeader: string | null,
  serviceRoleKey?: string,
): Promise<AuthedUserClient> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Não autorizado.' }
  }

  const jwt = authHeader.slice(7).trim()
  if (!jwt) {
    return { ok: false, status: 401, message: 'Não autorizado.' }
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  let user: AuthUser

  if (serviceRoleKey) {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user: authUser },
      error: userError,
    } = await adminClient.auth.getUser(jwt)

    if (userError || !authUser) {
      return {
        ok: false,
        status: 401,
        message: 'Sessão inválida ou expirada. Faça login novamente.',
      }
    }

    user = authUser

    if (authUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL) {
      return { ok: true, user, userClient }
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle()

    if (profile?.role === 'admin' || profile?.role === 'editor') {
      return { ok: true, user, userClient }
    }

    const { data: canManage, error: secretariatError } = await adminClient.rpc(
      'can_manage_secretariat',
      { p_user_id: authUser.id },
    )

    if (secretariatError || !canManage) {
      return { ok: false, status: 403, message: 'Sem permissão para esta ação.' }
    }

    return { ok: true, user, userClient }
  }

  const {
    data: { user: authUser },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !authUser) {
    return { ok: false, status: 401, message: 'Sessão inválida.' }
  }

  user = authUser

  const { data: allowed, error: rpcError } = await userClient.rpc(
    'is_admin_or_editor',
  )

  if (rpcError || !allowed) {
    const { data: canManage, error: secretariatError } = await userClient.rpc(
      'can_manage_secretariat',
      { p_user_id: authUser.id },
    )

    if (secretariatError || !canManage) {
      return { ok: false, status: 403, message: 'Sem permissão para esta ação.' }
    }
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
 * Valida Bearer JWT e exige papel admin.
 * Com serviceRoleKey, valida o JWT via Auth Admin (compatível com JWT assimétrico).
 */
export async function requireAdmin(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authHeader: string | null,
  serviceRoleKey?: string,
): Promise<AuthedUserClient> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'Token de autenticação ausente.' }
  }

  const jwt = authHeader.slice(7).trim()
  if (!jwt) {
    return { ok: false, status: 401, message: 'Token de autenticação ausente.' }
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  if (serviceRoleKey) {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(jwt)

    if (userError || !user) {
      return {
        ok: false,
        status: 401,
        message: 'Sessão inválida ou expirada. Faça login novamente.',
      }
    }

    if (user.email?.toLowerCase() === MASTER_ADMIN_EMAIL) {
      return { ok: true, user, userClient }
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return {
        ok: false,
        status: 500,
        message: 'Não foi possível validar permissões do administrador.',
      }
    }

    if (profile?.role !== 'admin') {
      return {
        ok: false,
        status: 403,
        message: 'Apenas administradores podem executar esta ação.',
      }
    }

    return { ok: true, user, userClient }
  }

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
