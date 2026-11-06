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
    expect(screen.getByText('Sessão')).toBeTruthy()
    expect(screen.getByText('Data')).toBeTruthy()
    expect(screen.getByText('Horário')).toBeTruthy()
    expect(screen.getAllByText('Grau').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Local')).toBeTruthy()
    expect(screen.queryByText('Sessão Ordinária')).toBeNull()
    expect(screen.queryByText('20:00')).toBeNull()
    expect(screen.queryByText('Aprendiz')).toBeNull()
    expect(screen.queryByText('Templo')).toBeNull()
    expect(screen.getByText('CIM')).toBeTruthy()
    expect(screen.getByText('Loja')).toBeTruthy()
    expect(screen.queryByText('Loja / Nº')).toBeNull()
    expect(screen.queryByText('Obediência')).toBeNull()
    expect(screen.getByText('Assinatura')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(
      screen.queryByText(/Linhas em branco para assinatura de visitantes/),
    ).toBeNull()
    expect(screen.getByText('VM Teste')).toBeTruthy()
    expect(screen.getByText('Chanceler Teste')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Esquadro e Compasso' })).toBeTruthy()
  })
})
