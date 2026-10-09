import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PersonNameInput } from './person-name-input'

function ControlledNameInput({ onBlur }: { onBlur?: () => void }) {
  const [value, setValue] = useState('')
  return <PersonNameInput aria-label="Nome" value={value} onChange={setValue} onBlur={onBlur} />
}

describe('PersonNameInput', () => {
  it('não altera o texto durante a digitação', () => {
    render(<ControlledNameInput />)
    const input = screen.getByLabelText('Nome') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'ALLAN ' } })
    expect(input.value).toBe('ALLAN ')
  })

  it('formata em Nome Próprio ao sair do campo e repassa o blur', () => {
    const onBlur = vi.fn()
    render(<ControlledNameInput onBlur={onBlur} />)
    const input = screen.getByLabelText('Nome') as HTMLInputElement
    fireEvent.change(input, { target: { value: '  ALLAN  TOMAZELA DE CAMARGO ' } })
    fireEvent.blur(input)
    expect(input.value).toBe('Allan Tomazela de Camargo')
    expect(onBlur).toHaveBeenCalledTimes(1)
  })
})
