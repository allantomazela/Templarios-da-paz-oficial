import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  ApplicationServer,
  importVapidKeys,
  PushMessageError,
  Urgency,
} from 'jsr:@negrel/webpush@0.5.0'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdminOrEditor } from '../_shared/auth.ts'

interface PushBody {
  title?: string
  message?: string
  link?: string
}

interface SubscriptionRow {
  id: string
  profile_id: string
  subscription_data: {
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
  } | null
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded =
    value.replaceAll('-', '+').replaceAll('_', '/') +
    '='.repeat((4 - (value.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function isMockEndpoint(endpoint: string | undefined): boolean {
  if (!endpoint) return true
  return endpoint.includes('mock')
}

async function loadApplicationServer(): Promise<ApplicationServer> {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:allantomazela@gmail.com'
  if (!publicKey || !privateKey) {
    throw new Error('Chaves de push não configuradas no servidor.')
  }

  const rawPublic = base64UrlToBytes(publicKey)
  if (rawPublic.length !== 65 || rawPublic[0] !== 4) {
    throw new Error('Chave pública de push inválida.')
  }

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToBase64Url(rawPublic.slice(1, 33)),
    y: bytesToBase64Url(rawPublic.slice(33, 65)),
    d: bytesToBase64Url(base64UrlToBytes(privateKey)),
  }

  const vapidKeys = await importVapidKeys({
    publicKey: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
    privateKey: jwk,
  })

  return ApplicationServer.new({
    contactInformation: subject,
    vapidKeys,
  })
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  const headers = {
    ...corsHeaders(origin, 'POST, OPTIONS'),
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers,
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  const auth = await requireAdminOrEditor(
    supabaseUrl,
    anonKey,
    req.headers.get('Authorization'),
    serviceRoleKey,
  )
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers,
    })
  }

  const { data: allowed, error: permissionError } = await auth.userClient.rpc(
    'is_admin_or_editor',
  )
  if (permissionError || !allowed) {
    return new Response(JSON.stringify({ error: 'Sem permissão para enviar o aviso.' }), {
      status: 403,
      headers,
    })
  }

  let body: PushBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Corpo inválido.' }), {
      status: 400,
      headers,
    })
  }

  const title = (body.title ?? '').trim().slice(0, 160)
  const message = (body.message ?? '').trim().slice(0, 1000)
  const link = (body.link ?? '/dashboard/agenda').trim().slice(0, 200) || '/dashboard/agenda'
  if (!title || !message) {
    return new Response(JSON.stringify({ error: 'Informe assunto e mensagem.' }), {
      status: 400,
      headers,
    })
  }

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const appServer = await loadApplicationServer()

    const { data: brothers, error: brothersError } = await admin
      .from('brothers')
      .select('profile_id')
      .eq('status', 'Ativo')
      .not('profile_id', 'is', null)

    if (brothersError) throw brothersError

    const brotherIds = [
      ...new Set(
        (brothers ?? [])
          .map((row) => row.profile_id as string | null)
          .filter((id): id is string => Boolean(id) && id !== auth.user.id),
      ),
    ]

    if (brotherIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, removed: 0, failed: 0 }), {
        status: 200,
        headers,
      })
    }

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id')
      .eq('status', 'approved')
      .in('id', brotherIds)

    if (profilesError) throw profilesError

    const approvedIds = (profiles ?? []).map((row) => row.id as string)
    if (approvedIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, removed: 0, failed: 0 }), {
        status: 200,
        headers,
      })
    }

    const { data: subscriptions, error: subscriptionsError } = await admin
      .from('push_subscriptions')
      .select('id, profile_id, subscription_data')
      .in('profile_id', approvedIds)

    if (subscriptionsError) throw subscriptionsError

    const payload = JSON.stringify({
      title,
      body: message.replace(/\s+/g, ' ').trim().slice(0, 180),
      url: link,
      tag: 'lodge-broadcast',
    })

    let sent = 0
    let failed = 0
    const goneIds: string[] = []

    for (const row of (subscriptions ?? []) as SubscriptionRow[]) {
      const endpoint = row.subscription_data?.endpoint
      const p256dh = row.subscription_data?.keys?.p256dh
      const authKey = row.subscription_data?.keys?.auth
      if (isMockEndpoint(endpoint) || !endpoint || !p256dh || !authKey) {
        if (row.id && isMockEndpoint(endpoint)) goneIds.push(row.id)
        continue
      }

      try {
        const subscriber = appServer.subscribe({
          endpoint,
          keys: { p256dh, auth: authKey },
        })
        await subscriber.pushTextMessage(payload, {
          ttl: 60 * 60 * 12,
          urgency: Urgency.High,
          topic: 'lodge-broadcast',
        })
        sent += 1
      } catch (error) {
        if (error instanceof PushMessageError && error.isGone()) {
          goneIds.push(row.id)
        } else {
          failed += 1
          console.error('push failed', row.profile_id, error)
        }
      }
    }

    if (goneIds.length > 0) {
      await admin.from('push_subscriptions').delete().in('id', goneIds)
    }

    return new Response(
      JSON.stringify({ sent, removed: goneIds.length, failed }),
      { status: 200, headers },
    )
  } catch (error) {
    console.error('send-lodge-push', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Falha ao enviar o push.',
      }),
      { status: 500, headers },
    )
  }
})
