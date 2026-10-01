import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PasswordInput } from './password-input'

describe('PasswordInput', () => {
  it('começa oculto e alterna para visível ao clicar no olho', () => {
    render(<PasswordInput placeholder="senha" />)
    const input = screen.getByPlaceholderText('senha')

    expect(input.getAttribute('type')).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input.getAttribute('type')).toBe('text')

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(input.getAttribute('type')).toBe('password')
  })

  it('não envia o formulário ao clicar no olho', () => {
    let submitted = false
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitted = true
        }}
      >
        <PasswordInput placeholder="senha" />
      </form>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(submitted).toBe(false)
  })
})
