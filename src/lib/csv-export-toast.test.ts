import { describe, expect, it, vi } from 'vitest'
import { runCsvExportWithToast } from './csv-export-toast'

describe('runCsvExportWithToast', () => {
  it('confirma a exportação com a descrição informada', () => {
    const toast = vi.fn()
    runCsvExportWithToast(toast, () => {}, 'Resumo por irmão baixado.')

    expect(toast).toHaveBeenCalledWith({
      title: 'CSV exportado',
      description: 'Resumo por irmão baixado.',
    })
  })

  it('mostra a mensagem do erro quando a exportação falha', () => {
    const toast = vi.fn()
    runCsvExportWithToast(
      toast,
      () => {
        throw new Error('Nenhum irmão em atraso para exportar.')
      },
      'ok',
    )

    expect(toast).toHaveBeenCalledWith({
      title: 'Erro ao exportar',
      description: 'Nenhum irmão em atraso para exportar.',
      variant: 'destructive',
    })
  })
})
