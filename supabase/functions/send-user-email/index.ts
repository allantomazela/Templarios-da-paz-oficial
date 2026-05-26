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
}

const MASTER_ADMIN_EMAIL = 'allantomazela@gmail.com'

async function canSendApproved(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
): Promise<boolean> {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
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
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader = req.headers.get('Authorization')

  try {
    const body = (await req.json()) as UserEmailBody
    const type = body.type
    const email = body.email?.trim().toLowerCase()
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

    let user: { id: string; email?: string } | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const {
        data: { user: authUser },
        error: userError,
      } = await userClient.auth.getUser()
      if (!userError && authUser) {
        user = authUser
      }
    }

    if (type === 'signup_pending') {
      const selfRequest = user?.email?.toLowerCase() === email
      let pendingOk = false
      if (serviceRoleKey) {
        const admin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { data: prof } = await admin
          .from('profiles')
          .select('id, status')
          .eq('email', email)
          .eq('status', 'pending')
          .maybeSingle()
        pendingOk = Boolean(prof)
      }
      if (!selfRequest && !pendingOk) {
        return new Response(JSON.stringify({ error: 'Sem permissão' }), {
          status: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
        })
      }
    } else if (type === 'account_approved') {
      if (!user || !authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Não autorizado' }), {
          status: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
        })
      }
      const bearer = authHeader.slice(7).trim()
      const isServiceRole =
        Boolean(serviceRoleKey) && bearer === serviceRoleKey
      const allowed =
        isServiceRole ||
        user.email === MASTER_ADMIN_EMAIL ||
        (serviceRoleKey
          ? await canSendApproved(supabaseUrl, serviceRoleKey, user.id)
          : false)
      if (!allowed) {
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
