import { describe, expect, it } from 'vitest'
import { buildPranchaPrintTitle, LODGE_PRANCHA_STATUS_LABEL } from './lodge-prancha'

describe('lodge-prancha', () => {
  it('monta título de impressão a partir do assunto', () => {
    expect(buildPranchaPrintTitle('  Auxílio  ')).toBe('Prancha — Auxílio')
  })

  it('usa título padrão quando assunto vazio', () => {
    expect(buildPranchaPrintTitle('')).toBe('Prancha para o saco de propostas')
  })

  it('tem rótulos de status', () => {
    expect(LODGE_PRANCHA_STATUS_LABEL.submitted).toBe('Enviada')
  })
})
