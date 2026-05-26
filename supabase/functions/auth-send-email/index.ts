/**
 * Hook Send Email do Supabase Auth (recuperação de senha).
 * Authentication → Hooks → Send Email no painel Supabase.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { sendViaResend } from '../_shared/resend-mail.ts'
import { passwordRecoveryEmail } from '../_shared/user-email-templates.ts'

const SITE_URL = 'https://templariosdapazoficial.com.br'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  if (!rawSecret) {
    console.error('SEND_EMAIL_HOOK_SECRET ausente')
    return new Response(JSON.stringify({ error: 'Hook não configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = await req.text()
  const hookHeaders = Object.fromEntries(req.headers)
  const secret = rawSecret.replace('v1,whsec_', '')
  const wh = new Webhook(secret)

  let user: { email: string; user_metadata?: Record<string, string> }
  let email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
  }

  try {
    const verified = wh.verify(payload, hookHeaders) as {
      user: typeof user
      email_data: typeof email_data
    }
    user = verified.user
    email_data = verified.email_data
  } catch (e) {
    console.error('Webhook verify failed', e)
    return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const action = email_data.email_action_type
  const email = user.email
  const name =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    'Irmão'

  if (action === 'recovery') {
    const redirectTo =
      email_data.redirect_to || `${SITE_URL}/reset-password`
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const resetLink = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`

    const mail = passwordRecoveryEmail(name, resetLink)
    const result = await sendViaResend({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } else {
    console.log(`E-mail Auth ignorado (action=${action}, to=${email})`)
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
