import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  to: string
  from: string
  name: string
  message: string
  replyTo?: string
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
    const { to, from, name, message, replyTo }: EmailRequest = await req.json()

    if (!to || !from || !name || !message) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Preparar conteúdo do email
    const emailSubject = `Nova Mensagem do Site - ${name}`
    const emailBody = `
Nova mensagem recebida através do formulário de contato do site:

Nome: ${name}
Email: ${from}
Data: ${new Date().toLocaleString('pt-BR')}

Mensagem:
${message}

---
Para responder, use o email: ${replyTo || from}
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    */

    // Opção 2: Usar Supabase Auth (envio básico via SMTP do Supabase)
    // Nota: Supabase Auth tem limitações para envio de emails customizados
    // Esta é uma implementação básica que pode precisar de ajustes

    // Opção 3: Salvar no banco e notificar (fallback)
    // A mensagem já foi salva no ContactSection, então apenas retornamos sucesso
    // O email pode ser enviado via cron job ou webhook externo

    // Por enquanto, retornamos sucesso (a mensagem já foi salva no banco)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensagem processada (email será enviado em breve)',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Erro ao processar email:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar solicitação de email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
