import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/auth.ts'

const MASTER_ADMIN_EMAIL = 'allantomazela@gmail.com'

interface DeleteBody {
  userId?: string
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

  const auth = await requireAdmin(
    supabaseUrl,
    supabaseAnonKey,
    req.headers.get('Authorization'),
  )

  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
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

  const userId = body.userId?.trim()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId é obrigatório.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  if (userId === auth.user.id) {
    return new Response(
      JSON.stringify({ error: 'Você não pode excluir sua própria conta.' }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: targetAuth, error: fetchError } =
    await adminClient.auth.admin.getUserById(userId)

  if (fetchError || !targetAuth?.user) {
    return new Response(JSON.stringify({ error: 'Usuário não encontrado.' }), {
      status: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  if (targetAuth.user.email === MASTER_ADMIN_EMAIL) {
    return new Response(
      JSON.stringify({ error: 'Não é permitido excluir o administrador principal.' }),
      {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    return new Response(
      JSON.stringify({
        error: deleteError.message || 'Não foi possível excluir o usuário.',
      }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
})
