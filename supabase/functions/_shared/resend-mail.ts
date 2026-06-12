export interface SendMailOptions {
  to: string
  subject: string
  html: string
  text: string
}

const DEFAULT_FROM =
  'Templarios da Paz <noreply@templariosdapazoficial.com.br>'

function parseResendError(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      message?: string
      error?: string | { message?: string }
    }
    if (typeof parsed.error === 'string') return parsed.error
    if (parsed.error && typeof parsed.error === 'object' && parsed.error.message) {
      return parsed.error.message
    }
    if (parsed.message) return parsed.message
  } catch {
    // texto bruto
  }
  return raw || 'Falha ao enviar e-mail via Resend'
}

export async function sendViaResend(
  options: SendMailOptions,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')?.trim() || DEFAULT_FROM

  if (!apiKey) {
    console.warn(
      'RESEND_API_KEY não configurada; e-mail não enviado:',
      options.subject,
    )
    return {
      ok: false,
      error: 'Serviço de e-mail não configurado (RESEND_API_KEY).',
    }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return { ok: false, error: parseResendError(err) }
  }

  return { ok: true }
}
