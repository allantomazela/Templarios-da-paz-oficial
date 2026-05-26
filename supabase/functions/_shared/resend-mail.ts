export interface SendMailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendViaResend(
  options: SendMailOptions,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from =
    Deno.env.get('EMAIL_FROM') ??
    'Templários da Paz <noreply@templariosdapazoficial.com.br>'

  if (!apiKey) {
    console.warn('RESEND_API_KEY não configurada; e-mail não enviado:', options.subject)
    return { ok: true, skipped: true }
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
    return { ok: false, error: err }
  }

  return { ok: true }
}
