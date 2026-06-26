import { describe, expect, it } from 'vitest'
import {
  canPreviewFinancialAttachment,
  canPreviewPendingFile,
  formatAttachmentFileSize,
  resolveFinancialAttachmentMimeType,
} from '@/lib/financial-attachment-access'

describe('financial-attachment-access', () => {
  it('resolve mime type pela extensão quando o upload veio genérico', () => {
    expect(
      resolveFinancialAttachmentMimeType({
        mimeType: 'application/octet-stream',
        fileName: 'nota-fiscal.pdf',
      }),
    ).toBe('application/pdf')
  })

  it('identifica arquivos visualizáveis', () => {
    expect(
      canPreviewFinancialAttachment({
        mimeType: 'image/png',
        fileName: 'comprovante.png',
      }),
    ).toBe(true)

    expect(
      canPreviewFinancialAttachment({
        mimeType: 'application/octet-stream',
        fileName: 'recibo.pdf',
      }),
    ).toBe(true)
  })

  it('formata tamanho de arquivo', () => {
    expect(formatAttachmentFileSize(512)).toBe('512 B')
    expect(formatAttachmentFileSize(2048)).toBe('2.0 KB')
    expect(formatAttachmentFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('valida pré-visualização de arquivo pendente', () => {
    const file = new File(['conteudo'], 'cupom.jpg', { type: 'image/jpeg' })
    expect(canPreviewPendingFile(file)).toBe(true)
  })
})
