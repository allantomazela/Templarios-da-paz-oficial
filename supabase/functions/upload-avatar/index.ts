import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAuthenticatedUser } from '../_shared/auth.ts'

const BUCKET = 'site-assets'
const MAX_BYTES = 5 * 1024 * 1024

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

  if (!serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Configuração do servidor incompleta.' }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  const auth = await requireAuthenticatedUser(
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

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    if (file.size > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande (máx. 5 MB).' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const mime = file.type || ''
    if (mime && !mime.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Apenas imagens são aceitas.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg'
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${safeExt}`
    const filePath = `avatars/${auth.user.id}/${fileName}`

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await adminClient.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: mime || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(BUCKET).getPublicUrl(filePath)

    return new Response(JSON.stringify({ publicUrl, filePath }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
