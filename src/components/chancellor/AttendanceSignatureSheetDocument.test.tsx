import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AttendanceSignatureSheetDocument } from './AttendanceSignatureSheetDocument'

const baseProps = {
  eventTitle: 'Sessão Ordinária',
  eventDate: '2026-10-15',
  eventTime: '20:00',
  locationName: 'Templo das Espadas',
  sessionDegree: 'Aprendiz' as const,
  venerableMaster: 'VM Teste',
  chancellor: 'Chanceler Teste',
}

describe('AttendanceSignatureSheetDocument', () => {
  it('renderiza uma linha por irmão com grau, CIM e assinaturas do rodapé', () => {
    render(
      <AttendanceSignatureSheetDocument
        {...baseProps}
        rows={[
          { order: 1, brotherId: 'a', name: 'Irmão A', degree: 'Mestre', cim: '123' },
          { order: 2, brotherId: 'b', name: 'Irmão B', degree: 'Aprendiz', cim: '' },
        ]}
      />,
    )
    expect(screen.getByText('Livro de Presença')).toBeTruthy()
    expect(screen.getByText('Irmão A')).toBeTruthy()
    expect(screen.getByText('123')).toBeTruthy()
    const brotherBRow = screen.getByText('Irmão B').closest('tr')
    expect(brotherBRow?.children[3]?.textContent).toBe('')
    expect(screen.getByRole('img', { name: 'Esquadro e Compasso' })).toBeTruthy()
    expect(screen.getByText('VM Teste')).toBeTruthy()
    expect(screen.getByText('Venerável Mestre em Exercício')).toBeTruthy()
    expect(screen.getByText('Chanceler Teste')).toBeTruthy()
    expect(screen.getByText(/convocados para esta sessão: 2/)).toBeTruthy()
  })

  it('avisa quando não há irmãos para o grau', () => {
    render(<AttendanceSignatureSheetDocument {...baseProps} rows={[]} />)
    expect(screen.getByText('Nenhum irmão ativo para o grau selecionado.')).toBeTruthy()
  })
})
