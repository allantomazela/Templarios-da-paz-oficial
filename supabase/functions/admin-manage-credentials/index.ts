import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/auth.ts'
import {
  assertCanManageTarget,
  isValidEmail,
  isValidNewPassword,
  normalizeEmail,
  verifyActorPassword,
  writeCredentialAudit,
} from '../_shared/admin-credentials.ts'

type CredentialAction = 'set_password' | 'change_email'

interface Body {
  action?: CredentialAction
  userId?: string
  user_id?: string
  adminPassword?: string
  admin_password?: string
  newPassword?: string
  new_password?: string
  newEmail?: string
  new_email?: string
  forcePasswordChange?: boolean
  force_password_change?: boolean
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

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Configuração do servidor incompleta.' }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Corpo da requisição inválido.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const action = body.action
  const userId = (body.userId ?? body.user_id)?.trim()
  const adminPassword = body.adminPassword ?? body.admin_password ?? ''
  const newPassword = body.newPassword ?? body.new_password ?? ''
  const newEmailRaw = body.newEmail ?? body.new_email ?? ''
  const forcePasswordChange =
    body.forcePasswordChange ?? body.force_password_change ?? true

  if (action !== 'set_password' && action !== 'change_email') {
    return new Response(
      JSON.stringify({
        error: 'Ação inválida. Use set_password ou change_email.',
      }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Informe userId.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const auth = await requireAdmin(
    supabaseUrl,
    supabaseAnonKey,
    req.headers.get('Authorization'),
    serviceRoleKey,
  )

  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const actorEmail = auth.user.email
  if (!actorEmail) {
    return new Response(
      JSON.stringify({ error: 'Conta do administrador sem e-mail.' }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  const passwordCheck = await verifyActorPassword(
    supabaseUrl,
    supabaseAnonKey,
    actorEmail,
    adminPassword,
  )
  if (!passwordCheck.ok) {
    return new Response(JSON.stringify({ error: passwordCheck.message }), {
      status: passwordCheck.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const targetCheck = await assertCanManageTarget(
    adminClient,
    auth.user.id,
    actorEmail,
    userId,
  )
  if (!targetCheck.ok) {
    return new Response(JSON.stringify({ error: targetCheck.message }), {
      status: targetCheck.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  try {
    if (action === 'set_password') {
      if (!isValidNewPassword(newPassword)) {
        return new Response(
          JSON.stringify({
            error:
              'A nova senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula e número.',
          }),
          {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          },
        )
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        userId,
        { password: newPassword },
      )
      if (updateError) {
        throw new Error(
          updateError.message || 'Não foi possível atualizar a senha.',
        )
      }

      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          must_change_password: forcePasswordChange !== false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (profileError) {
        throw new Error(
          'Senha atualizada, mas não foi possível marcar a troca obrigatória.',
        )
      }

      await writeCredentialAudit(adminClient, {
        actorUserId: auth.user.id,
        action: 'admin_set_password',
        targetUserId: userId,
        details: {
          target_email: targetCheck.targetEmail,
          force_password_change: forcePasswordChange !== false,
        },
      })

      return new Response(
        JSON.stringify({
          success: true,
          forcePasswordChange: forcePasswordChange !== false,
        }),
        {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const newEmail = normalizeEmail(newEmailRaw)
    if (!isValidEmail(newEmail)) {
      return new Response(JSON.stringify({ error: 'E-mail inválido.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const previousEmail = targetCheck.targetEmail
      ? normalizeEmail(targetCheck.targetEmail)
      : null

    if (previousEmail && previousEmail === newEmail) {
      return new Response(
        JSON.stringify({ error: 'O novo e-mail é igual ao atual.' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: emailTaken } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('email', newEmail)
      .neq('id', userId)
      .maybeSingle()

    if (emailTaken) {
      return new Response(
        JSON.stringify({
          error: 'Já existe outro usuário com este e-mail no sistema.',
        }),
        {
          status: 409,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const { error: authEmailError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        email: newEmail,
        email_confirm: true,
      },
    )
    if (authEmailError) {
      throw new Error(
        authEmailError.message || 'Não foi possível atualizar o e-mail de login.',
      )
    }

    const { error: profileEmailError } = await adminClient
      .from('profiles')
      .update({
        email: newEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileEmailError) {
      throw new Error(
        'E-mail de login atualizado, mas o perfil não sincronizou. Tente novamente.',
      )
    }

    await adminClient
      .from('brothers')
      .update({ email: newEmail })
      .eq('profile_id', userId)

    if (previousEmail) {
      await adminClient
        .from('brothers')
        .update({ email: newEmail, profile_id: userId })
        .is('profile_id', null)
        .ilike('email', previousEmail)
    }

    await writeCredentialAudit(adminClient, {
      actorUserId: auth.user.id,
      action: 'admin_change_email',
      targetUserId: userId,
      details: {
        previous_email: previousEmail,
        new_email: newEmail,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        email: newEmail,
        previousEmail,
      }),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível concluir a operação.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
