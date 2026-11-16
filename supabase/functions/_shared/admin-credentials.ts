import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

/** Alinhado a `_shared/auth.ts` e `src/config/master-admin.ts`. */
const MASTER_ADMIN_EMAIL = 'allantomazela@gmail.com'

type AdminClient = ReturnType<typeof createClient>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isMasterEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email)
}

export function isValidNewPassword(password: string): boolean {
  if (password.length < 8) return false
  return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
}

/**
 * Confirma a senha do administrador sem encerrar outras sessões.
 * Usa o endpoint de token do Auth e faz logout só da sessão criada
 * (`scope=local`), para não deslogar o painel no navegador.
 */
export async function verifyActorPassword(
  supabaseUrl: string,
  supabaseAnonKey: string,
  actorEmail: string,
  adminPassword: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const password = adminPassword?.trim() ?? ''
  if (!password) {
    return {
      ok: false,
      status: 400,
      message: 'Informe a sua senha de administrador para confirmar.',
    }
  }

  const tokenResponse = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: actorEmail, password }),
    },
  )

  if (!tokenResponse.ok) {
    return {
      ok: false,
      status: 403,
      message: 'Senha do administrador incorreta.',
    }
  }

  const tokens = (await tokenResponse.json()) as { access_token?: string }
  if (tokens.access_token) {
    await fetch(`${supabaseUrl}/auth/v1/logout?scope=local`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  return { ok: true }
}

export async function assertCanManageTarget(
  adminClient: AdminClient,
  actorUserId: string,
  actorEmail: string | undefined,
  targetUserId: string,
): Promise<
  | { ok: true; targetEmail: string | null; targetName: string | null }
  | { ok: false; status: number; message: string }
> {
  if (targetUserId === actorUserId) {
    return {
      ok: false,
      status: 400,
      message:
        'Use a tela Meu Perfil para alterar a sua própria senha ou e-mail.',
    }
  }

  const { data: target, error } = await adminClient
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', targetUserId)
    .maybeSingle()

  if (error || !target) {
    return { ok: false, status: 404, message: 'Usuário não encontrado.' }
  }

  const targetEmail = (target.email as string | null) ?? null
  if (isMasterEmail(targetEmail) && !isMasterEmail(actorEmail)) {
    return {
      ok: false,
      status: 403,
      message: 'Apenas o administrador master pode alterar esta conta.',
    }
  }

  return {
    ok: true,
    targetEmail,
    targetName: (target.full_name as string | null) ?? null,
  }
}

export async function writeCredentialAudit(
  adminClient: AdminClient,
  params: {
    actorUserId: string
    action: string
    targetUserId: string
    details: Record<string, unknown>
  },
): Promise<void> {
  const { error } = await adminClient.from('audit_logs').insert({
    profile_id: params.actorUserId,
    action: params.action,
    entity_type: 'profile',
    entity_id: params.targetUserId,
    details: params.details,
  })

  if (error) {
    console.error('Falha ao gravar audit_logs de credenciais:', error.message)
  }
}
