import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Image } from 'imagescript'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdminOrEditor } from '../_shared/auth.ts'

const ALLOWED_BUCKET = 'site-assets'
const MAX_FILE_BYTES = 12 * 1024 * 1024

function sanitizeFolder(folder: string): string | null {
  const trimmed = folder.replace(/^\/+|\/+$/g, '') || 'uploads'
  if (trimmed.length > 120 || trimmed.includes('..')) return null
  if (!/^[a-zA-Z0-9/_\-]+$/.test(trimmed)) return null
  return trimmed
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

  const auth = await requireAdminOrEditor(
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
    const bucketRaw = (formData.get('bucket') as string) || ALLOWED_BUCKET
    const folderRaw = (formData.get('folder') as string) || 'uploads'

    if (bucketRaw !== ALLOWED_BUCKET) {
      return new Response(
        JSON.stringify({ error: 'Bucket não permitido.' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const folder = sanitizeFolder(folderRaw)
    if (!folder) {
      return new Response(JSON.stringify({ error: 'Pasta inválida.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    if (file.size > MAX_FILE_BYTES) {
      return new Response(JSON.stringify({ error: 'Arquivo muito grande.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const mime = file.type || ''
    if (mime && !mime.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Apenas imagens são aceitas.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const arrayBuffer = await file.arrayBuffer()
    const image = await Image.decode(new Uint8Array(arrayBuffer))

    if (image.width > 1920) {
      image.resize(1920, Image.RESIZE_AUTO)
    }

    const optimizedBuffer = await image.encodeJPEG(80)

    const fileExt = 'jpg'
    const fileName =
      `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error } = await auth.userClient.storage
      .from(ALLOWED_BUCKET)
      .upload(filePath, optimizedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const {
      data: { publicUrl },
    } = auth.userClient.storage.from(ALLOWED_BUCKET).getPublicUrl(filePath)

    return new Response(JSON.stringify({ publicUrl, filePath }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
