import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisitorSignatureSheetDocument } from './VisitorSignatureSheetDocument'

describe('VisitorSignatureSheetDocument', () => {
  it('mostra cabeçalho de visitantes, CIM e linhas em branco', () => {
    render(
      <VisitorSignatureSheetDocument
        eventTitle="Sessão Ordinária"
        eventDate="2026-11-05"
        eventTime="20:00"
        locationName="Templo"
        sessionDegree="Aprendiz"
        venerableMaster="VM Teste"
        chancellor="Chanceler Teste"
        blankRowCount={5}
      />,
    )

    expect(screen.getByText('Livro de Presença — Visitantes')).toBeTruthy()
    expect(screen.getByText('CIM')).toBeTruthy()
    expect(screen.getByText('Loja / Nº')).toBeTruthy()
    expect(screen.getByText('Obediência')).toBeTruthy()
    expect(screen.getByText('Assinatura')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(
      screen.getByText(/Linhas em branco para assinatura de visitantes: 5/),
    ).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Esquadro e Compasso' })).toBeTruthy()
  })
})
