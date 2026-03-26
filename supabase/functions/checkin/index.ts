import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const ALLOWED_ORIGINS = [
  'https://templariosdapazoficial.com.br',
  'https://www.templariosdapazoficial.com.br',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
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

/** Coordenadas padrão do Templo e raio (50m) para geofencing */
const DEFAULT_TEMPLE_LAT = -22.8812604
const DEFAULT_TEMPLE_LNG = -48.4554303
const DEFAULT_RADIUS_METERS = 50
const GEO_ERROR_MESSAGE =
  'Você precisa estar fisicamente no Templo para assinar a presença.'

interface CheckinBody {
  sessionRecordId?: string
  token?: string
  latitude?: number
  longitude?: number
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  const headers = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Não autorizado. Faça login para fazer check-in.' }),
      {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    const body = (await req.json()) as CheckinBody
    const { sessionRecordId: bodySessionId, token, latitude, longitude } = body

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
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    let sessionRecordId: string

    if (token && typeof token === 'string' && token.trim()) {
      const { data: tokenRow, error: tokenError } = await serviceClient
        .from('checkin_tokens')
        .select('session_record_id, expires_at')
        .eq('token', token.trim())
        .single()

      if (tokenError || !tokenRow) {
        return new Response(
          JSON.stringify({ error: 'Token do QR Code inválido ou expirado.' }),
          {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          },
        )
      }
      const expiresAt = new Date(tokenRow.expires_at)
      if (expiresAt <= new Date()) {
        return new Response(
          JSON.stringify({ error: 'Token do QR Code expirado.' }),
          {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          },
        )
      }
      sessionRecordId = tokenRow.session_record_id
    } else if (bodySessionId && typeof bodySessionId === 'string') {
      sessionRecordId = bodySessionId
    } else {
      return new Response(
        JSON.stringify({ error: 'Envie o token do QR Code ou o ID da sessão.' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

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
          headers: { ...headers, 'Content-Type': 'application/json' },
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
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: settings } = await serviceClient
      .from('site_settings')
      .select('temple_latitude, temple_longitude, checkin_radius_meters, checkin_open_minutes_before')
      .eq('id', 1)
      .single()

    const openMinutes = settings?.checkin_open_minutes_before ?? 30
    const templeLat =
      settings?.temple_latitude != null ? settings.temple_latitude : DEFAULT_TEMPLE_LAT
    const templeLng =
      settings?.temple_longitude != null ? settings.temple_longitude : DEFAULT_TEMPLE_LNG
    const radiusMeters =
      settings?.checkin_radius_meters != null && settings.checkin_radius_meters > 0
        ? settings.checkin_radius_meters
        : DEFAULT_RADIUS_METERS

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
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    if (latitude == null || longitude == null) {
      return new Response(
        JSON.stringify({ error: GEO_ERROR_MESSAGE }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }
    const distance = haversineMeters(latitude, longitude, templeLat, templeLng)
    if (distance > radiusMeters) {
      return new Response(
        JSON.stringify({ error: GEO_ERROR_MESSAGE }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
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
            headers: { ...headers, 'Content-Type': 'application/json' },
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
        headers: { ...headers, 'Content-Type': 'application/json' },
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
        headers: { ...headers, 'Content-Type': 'application/json' },
      },
    )
  }
})
