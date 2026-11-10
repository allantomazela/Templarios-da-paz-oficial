import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/auth.ts'

interface CreateBody {
  fullName?: string
  email?: string
  password?: string
  phone?: string
}

const PLACEHOLDER_PHONE = '0000000000'
const PLACEHOLDER_DOB = '1900-01-01'

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

  let body: CreateBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Corpo da requisição inválido.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const fullName = body.fullName?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''
  const password = body.password ?? ''
  const phoneDigits = (body.phone ?? '').replace(/\D/g, '')
  const phone = phoneDigits.length >= 10 ? phoneDigits : PLACEHOLDER_PHONE

  if (fullName.length < 3) {
    return new Response(JSON.stringify({ error: 'Informe o nome completo.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Informe um e-mail válido.' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  if (password.length < 8) {
    return new Response(
      JSON.stringify({ error: 'A senha temporária deve ter no mínimo 8 caracteres.' }),
      {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
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

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: fullName,
          masonic_degree: 'Aprendiz',
          role: 'member',
          pre_initiation: 'true',
        },
      })

    if (createError || !created.user) {
      const message = createError?.message || 'Não foi possível criar a conta.'
      const status = message.toLowerCase().includes('already') ? 409 : 400
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const userId = created.user.id

    // Garante status e confirmação mesmo se o trigger de perfil atrasar.
    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        role: 'member',
        status: 'pre_iniciacao',
        masonic_degree: 'Aprendiz',
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({
          error: profileError.message || 'Falha ao gravar o perfil. Conta não foi mantida.',
        }),
        {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    await adminClient.auth.admin.updateUserById(userId, { email_confirm: true })

    const { data: existingBrother } = await adminClient
      .from('brothers')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    const brotherPayload = {
      name: fullName,
      email,
      phone,
      degree: 'Aprendiz',
      dob: PLACEHOLDER_DOB,
      initiation_date: new Date().toISOString().slice(0, 10),
      membership_situation: 'pre_iniciacao',
      status: 'Inativo',
      regular_status: 'Pré-iniciação',
      profile_id: userId,
      notes:
        'Pré-iniciação criada pelo administrador. Completar dados pessoais. Data de iniciação será confirmada na admissão ao quadro.',
      updated_at: new Date().toISOString(),
    }

    if (existingBrother?.id) {
      const { error: brotherError } = await adminClient
        .from('brothers')
        .update(brotherPayload)
        .eq('id', existingBrother.id)
      if (brotherError) {
        return new Response(
          JSON.stringify({
            error:
              brotherError.message ||
              'Conta criada, mas falhou ao vincular o cadastro na secretaria.',
            userId,
          }),
          {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
          },
        )
      }
    } else {
      const { error: brotherError } = await adminClient
        .from('brothers')
        .insert(brotherPayload)
      if (brotherError) {
        return new Response(
          JSON.stringify({
            error:
              brotherError.message ||
              'Conta criada, mas falhou ao criar o cadastro na secretaria.',
            userId,
          }),
          {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email,
        fullName,
      }),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro inesperado ao criar iniciando.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
