import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { sendViaResend } from '../_shared/resend-mail.ts'
import {
  accountApprovedEmail,
  signupPendingEmail,
} from '../_shared/user-email-templates.ts'

type EmailType = 'signup_pending' | 'account_approved'

interface UserEmailBody {
  type?: EmailType
  email?: string
  full_name?: string
  profile_id?: string
}

const MASTER_ADMIN_EMAIL = 'allantomazela@gmail.com'

function isServiceRoleBearer(bearer: string, serviceRoleKey: string): boolean {
  if (!bearer) return false
  if (serviceRoleKey && bearer === serviceRoleKey) return true

  try {
    const parts = bearer.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as { role?: string }
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

function normalizeEmail(email: string | undefined): string | null {
  if (!email) return null
  const value = email.trim().toLowerCase()
  return value.length > 0 ? value : null
}

async function resolveAuthUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  bearer: string,
): Promise<{ id: string; email?: string } | null> {
  if (!bearer) return null

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(bearer)

  if (error || !user) return null
  return user
}

async function canSendApproved(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role === 'admin') return true

  const { data: canApprove } = await admin.rpc('can_approve_users', {
    p_user_id: userId,
  })

  return Boolean(canApprove)
}

async function resolveProfileId(
  admin: ReturnType<typeof createClient>,
  email: string,
  profileId?: string,
): Promise<string | null> {
  if (profileId?.trim()) return profileId.trim()

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle()

  return profile?.id ?? null
}

async function getProfileStatus(
  admin: ReturnType<typeof createClient>,
  profileId: string,
): Promise<string | null> {
  const { data: profile } = await admin
    .from('profiles')
    .select('status')
    .eq('id', profileId)
    .maybeSingle()

  return profile?.status ?? null
}

async function hasProfileStatusByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
  status: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from('profiles')
    .select('id, status')
    .ilike('email', email)
    .maybeSingle()

  return profile?.status === status
}

async function wasEmailAlreadySent(
  admin: ReturnType<typeof createClient>,
  profileId: string,
  type: EmailType,
): Promise<boolean> {
  const { data } = await admin
    .from('user_email_log')
    .select('profile_id')
    .eq('profile_id', profileId)
    .eq('email_type', type)
    .maybeSingle()

  return Boolean(data)
}

async function markEmailSent(
  admin: ReturnType<typeof createClient>,
  profileId: string,
  type: EmailType,
  email: string,
): Promise<void> {
  await admin.from('user_email_log').upsert(
    {
      profile_id: profileId,
      email_type: type,
      email,
      sent_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id,email_type', ignoreDuplicates: true },
  )
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  const headers = corsHeaders(origin, 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader = req.headers.get('Authorization')
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : ''
  const isServiceRole = isServiceRoleBearer(bearer, serviceRoleKey)

  try {
    const body = (await req.json()) as UserEmailBody
    const type = body.type
    const email = normalizeEmail(body.email)
    const fullName = body.full_name?.trim() || 'Irmão'

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: 'type e email são obrigatórios' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta.' }),
        {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const profileId = await resolveProfileId(admin, email, body.profile_id)

    if (profileId) {
      const alreadySent = await wasEmailAlreadySent(admin, profileId, type)
      if (alreadySent) {
        return new Response(
          JSON.stringify({
            success: true,
            skipped: true,
            type,
            reason: 'already_sent',
          }),
          {
            status: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    const user =
      !isServiceRole && bearer
        ? await resolveAuthUser(supabaseUrl, serviceRoleKey, bearer)
        : null

    if (isServiceRole) {
      // Chamadas internas (pg_net / banco) ou service role explícito.
    } else if (type === 'signup_pending') {
      const selfRequest = user?.email?.toLowerCase() === email
      const pendingById =
        profileId &&
        (await getProfileStatus(admin, profileId)) === 'pending'
      const pendingByEmail = await hasProfileStatusByEmail(
        admin,
        email,
        'pending',
      )

      if (!selfRequest && !pendingById && !pendingByEmail) {
        return new Response(JSON.stringify({ error: 'Sem permissão' }), {
          status: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
        })
      }
    } else if (type === 'account_approved') {
      const approvedById =
        profileId &&
        (await getProfileStatus(admin, profileId)) === 'approved'
      const approvedByEmail = await hasProfileStatusByEmail(
        admin,
        email,
        'approved',
      )
      const profileApproved = Boolean(approvedById || approvedByEmail)

      const callerCanApprove =
        user &&
        (user.email?.toLowerCase() === MASTER_ADMIN_EMAIL ||
          (await canSendApproved(admin, user.id)))

      if (!profileApproved || !callerCanApprove) {
        return new Response(JSON.stringify({ error: 'Sem permissão' }), {
          status: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
        })
      }
    } else {
      return new Response(JSON.stringify({ error: 'Tipo inválido' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const mail =
      type === 'signup_pending'
        ? signupPendingEmail(fullName)
        : accountApprovedEmail(fullName)

    const result = await sendViaResend({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    if (!result.ok) {
      return new Response(
        JSON.stringify({ error: result.error ?? 'Falha ao enviar e-mail' }),
        {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    if (profileId && !result.skipped) {
      await markEmailSent(admin, profileId, type, email)
    }

    return new Response(
      JSON.stringify({ success: true, skipped: result.skipped ?? false, type }),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
