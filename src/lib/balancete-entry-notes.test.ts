import { describe, expect, it } from 'vitest'
import { formatBalanceteEntryNotesCompact } from './balancete-entry-notes'

describe('formatBalanceteEntryNotesCompact', () => {
  it('retorna null quando não há observação nem comprovante', () => {
    expect(formatBalanceteEntryNotesCompact(undefined, [])).toBeNull()
    expect(formatBalanceteEntryNotesCompact('  ', [])).toBeNull()
  })

  it('formata observação sozinha', () => {
    const result = formatBalanceteEntryNotesCompact('Pagamento referente março', [])
    expect(result?.text).toBe('Pagamento referente março')
  })

  it('formata um comprovante em linha única', () => {
    const result = formatBalanceteEntryNotesCompact(undefined, [
      { documentTypeLabel: 'Nota Fiscal', fileName: 'nf-01.pdf' },
    ])
    expect(result?.text).toBe('Nota Fiscal: nf-01.pdf')
  })

  it('resume vários comprovantes sem lista vertical', () => {
    const result = formatBalanceteEntryNotesCompact('Boleto pago', [
      { documentTypeLabel: 'NF', fileName: 'a.pdf' },
      { documentTypeLabel: 'Boleto', fileName: 'b.pdf' },
    ])
    expect(result?.text).toContain('2 comprovantes')
    expect(result?.text).toContain('Boleto pago')
    expect(result?.title).toContain('Boleto pago')
  })
})
