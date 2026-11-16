const ACCESS_URL = 'https://www.templariosdapazoficial.com.br'

/** Texto pronto para enviar ao irmão com acesso provisório. */
export function buildMemberAccessMessage(params: {
  fullName: string
  email?: string | null
  password: string
}): string {
  const name = params.fullName.trim() || 'Irmão'
  const email = params.email?.trim() || '(e-mail não informado)'
  const password = params.password

  return [
    'Templários da Paz — acesso ao sistema',
    '',
    `Nome: ${name}`,
    `E-mail: ${email}`,
    `Senha provisória: ${password}`,
    '',
    `Acesse: ${ACCESS_URL}`,
    '',
    'Como entrar:',
    '1) Abra o link acima no navegador (celular ou computador).',
    '2) Em Entrar, use o e-mail e a senha provisória.',
    '3) Na primeira entrada o sistema pedirá que você escolha uma senha pessoal.',
    '4) Guarde a nova senha com segurança e não compartilhe com outras pessoas.',
  ].join('\n')
}
