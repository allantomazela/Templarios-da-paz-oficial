import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionDegreeSelect } from './SessionDegreeSelect'

describe('SessionDegreeSelect', () => {
  it('mostra o grau selecionado', () => {
    render(
      <SessionDegreeSelect id="degree" value="Aprendiz" onChange={vi.fn()} />,
    )
    expect(screen.getByLabelText('Grau da sessão')).toBeTruthy()
    expect(screen.getByText('Aprendiz')).toBeTruthy()
  })

  it('mostra "Não informado" quando não há grau', () => {
    render(<SessionDegreeSelect id="degree" value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Não informado')).toBeTruthy()
  })
})
