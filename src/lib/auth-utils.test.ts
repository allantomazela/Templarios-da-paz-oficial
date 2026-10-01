import { describe, expect, it } from 'vitest'
import {
  getPasswordRecoveryErrorMessage,
  getPasswordUpdateErrorMessage,
} from './auth-utils'

describe('getPasswordUpdateErrorMessage', () => {
  it('traduz senha igual à anterior', () => {
    expect(
      getPasswordUpdateErrorMessage({
        code: 'same_password',
        message: 'New password should be different from the old password.',
      }),
    ).toBe('A nova senha deve ser diferente da senha atual.')
  })

  it('traduz senha vazada/comum antes da regra genérica de senha fraca', () => {
    expect(
      getPasswordUpdateErrorMessage({
        code: 'weak_password',
        message: 'Password is known to be weak and easy to guess, please choose a different one.',
      }),
    ).toContain('muito comum')
  })

  it('traduz senha curta', () => {
    expect(
      getPasswordUpdateErrorMessage({
        code: 'weak_password',
        message: 'Password should be at least 8 characters.',
      }),
    ).toContain('pelo menos 8 caracteres')
  })

  it('traduz sessão ausente', () => {
    expect(
      getPasswordUpdateErrorMessage({ message: 'Auth session missing!' }),
    ).toContain('sessão de recuperação expirou')
  })

  it('usa mensagem genérica em português para erros desconhecidos', () => {
    expect(getPasswordUpdateErrorMessage({ message: 'Something odd' })).toContain(
      'Não foi possível redefinir a senha',
    )
  })
})

describe('getPasswordRecoveryErrorMessage', () => {
  it('traduz rate limit', () => {
    expect(
      getPasswordRecoveryErrorMessage({ status: 429, message: 'email rate limit exceeded' }),
    ).toContain('Muitas solicitações')
  })

  it('usa mensagem genérica para falha do hook', () => {
    expect(
      getPasswordRecoveryErrorMessage({
        status: 500,
        message: 'Unexpected status code returned from hook: 404',
      }),
    ).toContain('Não foi possível enviar o e-mail de recuperação')
  })
})
