const SITE_NAME = 'Templários da Paz'
const LOGIN_URL = 'https://templariosdapazoficial.com.br/login'

function layout(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>${title}</title></head>
<body style="font-family:Georgia,serif;line-height:1.6;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
<h1 style="color:#8B4513;font-size:1.25rem">${SITE_NAME}</h1>
${body}
<p style="margin-top:32px;font-size:12px;color:#666">Este é um e-mail automático. Não responda diretamente.</p>
</body></html>`
}

export function signupPendingEmail(fullName: string) {
  const name = fullName || 'Irmão'
  const subject = `${SITE_NAME} — Cadastro recebido`
  const text = `Olá, ${name}!

Seu cadastro no sistema ${SITE_NAME} foi recebido com sucesso.

Sua conta está aguardando aprovação da diretoria ou da administração da loja. Você receberá outro e-mail quando o acesso for liberado.

Até lá, não será possível entrar no painel com seu e-mail e senha.

Fraternalmente,
${SITE_NAME}`

  const html = layout(
    subject,
    `<p>Olá, <strong>${name}</strong>,</p>
<p>Seu cadastro foi <strong>recebido com sucesso</strong>.</p>
<p>Sua conta está <strong>aguardando aprovação</strong> da diretoria ou da administração da loja. Você receberá outro e-mail quando o acesso for liberado.</p>
<p>Até lá, não será possível entrar no painel.</p>`,
  )
  return { subject, html, text }
}

export function accountApprovedEmail(fullName: string) {
  const name = fullName || 'Irmão'
  const subject = `${SITE_NAME} — Acesso aprovado`
  const text = `Olá, ${name}!

Sua conta no ${SITE_NAME} foi aprovada. Você já pode acessar o painel:

${LOGIN_URL}

Use o e-mail e a senha definidos no cadastro.

Fraternalmente,
${SITE_NAME}`

  const html = layout(
    subject,
    `<p>Olá, <strong>${name}</strong>,</p>
<p>Sua conta foi <strong>aprovada</strong>. Você já pode acessar o painel:</p>
<p><a href="${LOGIN_URL}" style="color:#8B4513">${LOGIN_URL}</a></p>
<p>Use o e-mail e a senha definidos no cadastro.</p>`,
  )
  return { subject, html, text }
}

export function passwordRecoveryEmail(
  fullName: string,
  resetLink: string,
) {
  const name = fullName || 'Irmão'
  const subject = `${SITE_NAME} — Redefinir senha`
  const text = `Olá, ${name}!

Recebemos uma solicitação para redefinir sua senha no ${SITE_NAME}.

Acesse o link abaixo (válido por tempo limitado):

${resetLink}

Se você não solicitou, ignore este e-mail.

Fraternalmente,
${SITE_NAME}`

  const html = layout(
    subject,
    `<p>Olá, <strong>${name}</strong>,</p>
<p>Recebemos uma solicitação para <strong>redefinir sua senha</strong>.</p>
<p><a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#8B4513;color:#fff;text-decoration:none;border-radius:4px">Redefinir senha</a></p>
<p style="font-size:13px;color:#666">Ou copie o link: ${resetLink}</p>
<p>Se você não solicitou, ignore este e-mail.</p>`,
  )
  return { subject, html, text }
}
