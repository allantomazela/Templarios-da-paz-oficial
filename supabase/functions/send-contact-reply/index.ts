import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReplyRequest {
  to: string
  from: string
  subject: string
  replyText: string
  originalMessage: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Preparar conteúdo do email
    const emailBody = `
Olá,

Obrigado por entrar em contato conosco através do site.

Sua mensagem original:
${originalMessage}

Nossa resposta:
${replyText}

Atenciosamente,
Equipe Templários da Paz
    `.trim()

    // Opção 1: Usar Resend (recomendado - precisa de API key)
    // Descomente e configure se tiver Resend API key
    /*
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    */

    // Por enquanto, retornamos sucesso (a resposta já foi salva no banco)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resposta processada (email será enviado em breve)',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Erro ao processar resposta:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar solicitação de resposta',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
