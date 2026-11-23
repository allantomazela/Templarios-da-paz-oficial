import { describe, expect, it } from 'vitest'
import {
  normalizePranchaBodyHtml,
  pranchaHtmlToPlainText,
  sanitizePranchaHtml,
} from './lodge-prancha-html'

describe('lodge-prancha-html', () => {
  it('preserva quebras simples e parágrafos no texto legado', () => {
    const html = normalizePranchaBodyHtml('Linha 1\nLinha 2\n\nParágrafo 2')
    expect(html).toContain('<br>')
    expect(html).toContain('<p>')
    expect(html).toContain('Linha 1')
    expect(html).toContain('Parágrafo 2')
  })

  it('mantém HTML já formatado', () => {
    const input = '<p>Pedido <strong>urgente</strong></p>'
    expect(normalizePranchaBodyHtml(input)).toBe(input)
  })

  it('extrai texto plano para validação', () => {
    expect(pranchaHtmlToPlainText('<p>Olá <strong>mundo</strong></p>')).toBe(
      'Olá mundo',
    )
  })

  it('mantém alinhamento e negrito após sanitizar', () => {
    const clean = sanitizePranchaHtml(
      '<p style="text-align: center"><strong>Pedido</strong></p><script>x</script>',
    )
    expect(clean).toContain('text-align: center')
    expect(clean).toContain('<strong>Pedido</strong>')
    expect(clean).not.toContain('script')
  })
})
