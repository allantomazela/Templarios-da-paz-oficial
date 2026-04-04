import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Notificação opcional de formulário de contato.
 * A mensagem já é persistida em `contact_messages` pelo cliente público;
 * este endpoint não deve usar service_role nem ser necessário para o fluxo principal.
 *
 * Uso futuro (ex.: Resend): preferir gatilho no banco ou fila, não dependência desta função a partir do site público.
 */
interface EmailRequest {
  to: string
  from: string
  name: string
  message: string
  replyTo?: string
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

  try {
    const { to, from, name, message }: EmailRequest = await req.json()

    if (!to || !from || !name || !message) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        },
      )
    }

    /*
    const emailSubject = `Nova Mensagem do Site - ${name}`
    const emailBody = `...` // montar com name, from, message, replyTo

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Templários da Paz <noreply@templariosdapaz.com.br>',
          to: [to],
          reply_to: replyTo || from,
          subject: emailSubject,
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
        message:
          'Mensagem já registrada no sistema; envio por e-mail será tratado separadamente.',
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: unknown) {
    console.error('Erro ao processar email:', error)
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return new Response(
      JSON.stringify({
        error: message || 'Erro ao processar solicitação de email',
      }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
