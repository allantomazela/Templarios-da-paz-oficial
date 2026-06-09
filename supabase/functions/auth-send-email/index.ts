/**
 * Hook Send Email do Supabase Auth (recuperação de senha).
 * Suporta:
 * - Corpo JSON direto do Supabase (com ou sem token no header)
 * - Authorization: Bearer quando o painel exige "Require authorization token"
 * - Assinatura standardwebhooks (webhook-signature) quando presente
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { sendViaResend } from '../_shared/resend-mail.ts'
import { passwordRecoveryEmail } from '../_shared/user-email-templates.ts'

const SITE_URL = 'https://templariosdapazoficial.com.br'

interface AuthHookBody {
  user: {
    email: string
    user_metadata?: Record<string, string>
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url?: string
  }
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get('Authorization') ?? req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7).trim()
}

function hookSecretVariants(): string[] {
  const raw = [
    Deno.env.get('SEND_EMAIL_HOOK_SECRET'),
    Deno.env.get('HOOK_AUTH_TOKEN'),
  ]
    .map((s) => s?.trim())
    .filter(Boolean) as string[]

  const variants = new Set<string>()
  for (const s of raw) {
    variants.add(s)
    if (s.startsWith('v1,whsec_')) {
      variants.add(s.slice('v1,whsec_'.length))
    } else {
      variants.add(`v1,whsec_${s}`)
    }
  }
  return [...variants]
}

function hookSecretsMatch(token: string | null): boolean {
  if (!token) return false
  const variants = hookSecretVariants()
  if (variants.length === 0) return false
  return variants.includes(token.trim())
}

function parseBody(payload: string): AuthHookBody | null {
  try {
    return JSON.parse(payload) as AuthHookBody
  } catch {
    return null
  }
}

function verifyStandardWebhook(
  payload: string,
  headers: Record<string, string>,
): AuthHookBody | null {
  const rawSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  if (!rawSecret) return null
  if (!headers['webhook-signature'] && !headers['webhook-id']) return null

  try {
    const secret = rawSecret.replace(/^v1,whsec_/, '')
    const wh = new Webhook(secret)
    return wh.verify(payload, headers) as AuthHookBody
  } catch (e) {
    console.error('standardwebhooks verify failed', e)
    return null
  }
}

function isValidHookBody(body: AuthHookBody | null): body is AuthHookBody {
  return Boolean(
    body?.user?.email &&
      body?.email_data?.email_action_type &&
      body?.email_data?.token_hash,
  )
}

function authorizeHook(
  req: Request,
  payload: string,
  headers: Record<string, string>,
): { ok: true; body: AuthHookBody } | { ok: false; status: number; message: string } {
  const webhookBody = verifyStandardWebhook(payload, headers)
  if (webhookBody && isValidHookBody(webhookBody)) {
    return { ok: true, body: webhookBody }
  }

  const parsed = parseBody(payload)
  if (!isValidHookBody(parsed)) {
    return { ok: false, status: 400, message: 'Payload inválido' }
  }

  if (hookSecretsMatch(extractBearerToken(req))) {
    return { ok: true, body: parsed }
  }

  const hasWebhookHeaders =
    Boolean(headers['webhook-signature']) || Boolean(headers['webhook-id'])
  if (hasWebhookHeaders) {
    return { ok: false, status: 401, message: 'Assinatura inválida' }
  }

  return { ok: false, status: 401, message: 'Não autorizado' }
}

serve(async (req) => {
  try {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  const auth = authorizeHook(req, payload, headers)
  if (!auth.ok) {
    console.error('auth-send-email denied:', auth.message)
    return jsonResponse({ error: auth.message }, auth.status)
  }

  const body = auth.body

  const action = body.email_data.email_action_type
  const email = body.user.email
  const name =
    body.user.user_metadata?.name ||
    body.user.user_metadata?.full_name ||
    'Irmão'

  if (action !== 'recovery') {
    console.log(`Auth hook: action=${action}, email=${email} (sem envio)`)
    return jsonResponse({}, 200)
  }

  const redirectTo =
    body.email_data.redirect_to || `${SITE_URL}/reset-password`
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const resetLink = `${supabaseUrl}/auth/v1/verify?token=${body.email_data.token_hash}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`

  const mail = passwordRecoveryEmail(name, resetLink)
  const result = await sendViaResend({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  })

  if (!result.ok) {
    console.error('Resend error:', result.error)
    return jsonResponse(
      { error: result.error ?? 'Falha ao enviar e-mail' },
      500,
    )
  }

  console.log(`Recovery email sent to ${email}`)
  return jsonResponse({}, 200)
  } catch (e) {
    console.error('auth-send-email unhandled error:', e)
    return jsonResponse({ error: 'Erro interno no hook de e-mail' }, 500)
  }
})
