import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** Distância em metros entre dois pontos (fórmula de Haversine). */
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3 // raio da Terra em metros
  const toRad = (x: number) => (x * Math.PI) / 180
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dPhi = toRad(lat2 - lat1)
  const dLambda = toRad(lon2 - lon1)
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface CheckinBody {
  sessionRecordId: string
  latitude?: number
  longitude?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Não autorizado. Faça login para fazer check-in.' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    const body = (await req.json()) as CheckinBody
    const { sessionRecordId, latitude, longitude } = body

    if (!sessionRecordId || typeof sessionRecordId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'sessionRecordId é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida. Faça login novamente.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: sessionRecord, error: sessionError } = await serviceClient
      .from('session_records')
      .select('id, event_id, date')
      .eq('id', sessionRecordId)
      .single()

    if (sessionError || !sessionRecord) {
      return new Response(
        JSON.stringify({ error: 'Sessão não encontrada ou inválida.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: event, error: eventError } = await serviceClient
      .from('events')
      .select('id, date, time')
      .eq('id', sessionRecord.event_id)
      .single()

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Evento da sessão não encontrado.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: settings } = await serviceClient
      .from('site_settings')
      .select('temple_latitude, temple_longitude, checkin_radius_meters, checkin_open_minutes_before')
      .eq('id', 1)
      .single()

    const openMinutes = settings?.checkin_open_minutes_before ?? 30
    const templeLat = settings?.temple_latitude
    const templeLng = settings?.temple_longitude
    const radiusMeters = settings?.checkin_radius_meters

    const now = new Date()
    const sessionDate = new Date(event.date + 'T' + event.time)
    const openAt = new Date(sessionDate.getTime() - openMinutes * 60 * 1000)

    if (now < openAt) {
      return new Response(
        JSON.stringify({
          error: `Check-in liberado a partir de ${openAt.toLocaleString('pt-BR')}.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (
      templeLat != null &&
      templeLng != null &&
      radiusMeters != null &&
      radiusMeters > 0
    ) {
      if (latitude == null || longitude == null) {
        return new Response(
          JSON.stringify({
            error: 'É necessário permitir a localização para fazer check-in neste templo.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
      const distance = haversineMeters(latitude, longitude, templeLat, templeLng)
      if (distance > radiusMeters) {
        return new Response(
          JSON.stringify({
            error: `Você está a ${Math.round(distance)} m do templo. O check-in é permitido apenas dentro de ${radiusMeters} m.`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    const { error: insertError } = await userClient.from('attendance').insert({
      session_record_id: sessionRecordId,
      brother_id: user.id,
      status: 'Presente',
      source: 'qr_checkin',
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'Você já realizou check-in nesta sessão.' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
      throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Check-in realizado com sucesso.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: unknown) {
    console.error('Check-in error:', err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Erro ao processar check-in.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
