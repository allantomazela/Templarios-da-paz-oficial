import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Image } from 'imagescript'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = (formData.get('bucket') as string) || 'site-assets'
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Optimization Logic
    const arrayBuffer = await file.arrayBuffer()
    const image = await Image.decode(new Uint8Array(arrayBuffer))

    // Resize if too large (e.g. > 1920px width)
    if (image.width > 1920) {
      image.resize(1920, Image.RESIZE_AUTO)
    }

    // Compress (JPEG quality 80)
    const optimizedBuffer = await image.encodeJPEG(80)

    // Upload to Supabase Storage
    const supabaseClient = createClient(
      // Supabase API URL - Env var automatically populated by Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase Service Role Key - Need service role to bypass policies if needed,
      // or Anon key if RLS allows. Using Service Role safe for Edge Functions usually.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const fileExt = 'jpg' // Converted to JPEG
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, optimizedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabaseClient.storage.from(bucket).getPublicUrl(filePath)

    return new Response(JSON.stringify({ publicUrl, filePath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
