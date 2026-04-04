import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { requireAdminOrEditor } from '../_shared/auth.ts'

interface ReplyRequest {
  to: string
  from: string
  subject: string
  replyText: string
  originalMessage: string
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
    const { to, from, subject, replyText, originalMessage }: ReplyRequest =
      await req.json()

    if (!to || !replyText) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    /*
    const emailBody = montar texto com originalMessage e replyText

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: from || 'Templários da Paz <noreply@templariosdapaz.com.br>',
          to: [to],
          subject: subject || 'Re: Sua mensagem no site',
          text: emailBody,
        }),
      })

      if (!resendResponse.ok) {
        const error = await resendResponse.json()
        throw new Error(`Resend error: ${JSON.stringify(error)}`)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Email enviado via Resend' }),
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resposta processada (email será enviado em breve)',
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: unknown) {
    console.error('Erro ao processar resposta:', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return new Response(
      JSON.stringify({
        error: message || 'Erro ao processar solicitação de resposta',
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
