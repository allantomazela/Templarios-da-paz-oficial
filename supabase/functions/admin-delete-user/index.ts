import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin, requireAdminOrEditor } from '../_shared/auth.ts'
import { deleteMemberFromSystem } from '../_shared/member-deletion.ts'

interface DeleteBody {
  userId?: string
  brotherId?: string
  user_id?: string
  brother_id?: string
  id?: string
}

function parseDeleteIds(body: DeleteBody): {
  userId?: string
  brotherId?: string
} {
  const userId = (body.userId ?? body.user_id)?.trim() || undefined
  const brotherId = (body.brotherId ?? body.brother_id ?? body.id)?.trim() ||
    undefined
  return { userId, brotherId }
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

  let body: DeleteBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Corpo da requisição inválido.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const { userId, brotherId } = parseDeleteIds(body)

  if (!userId && !brotherId) {
    return new Response(
      JSON.stringify({
        error: 'Informe userId ou brotherId.',
        hint: 'Envie { "brotherId": "<uuid>" } na secretaria ou { "userId": "<uuid>" } no admin.',
      }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  const authHeader = req.headers.get('Authorization')
  const auth =
    brotherId && !userId
      ? await requireAdminOrEditor(
          supabaseUrl,
          supabaseAnonKey,
          authHeader,
          serviceRoleKey,
        )
      : await requireAdmin(
          supabaseUrl,
          supabaseAnonKey,
          authHeader,
          serviceRoleKey,
        )

  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const result = await deleteMemberFromSystem(adminClient, {
      userId,
      brotherId,
      actorUserId: auth.user.id,
    })

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível excluir o usuário.'
    const status =
      message.includes('não encontrad') || message.includes('não encontrado')
        ? 404
        : message.includes('não pode') || message.includes('não é permitido')
          ? 403
          : 500

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
