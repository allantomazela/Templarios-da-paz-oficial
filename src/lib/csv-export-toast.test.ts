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

  it('confirma só com o título quando não há descrição', () => {
    const toast = vi.fn()
    runCsvExportWithToast(toast, () => {}, undefined, {
      successTitle: 'CSV detalhado exportado',
    })

    expect(toast).toHaveBeenCalledWith({ title: 'CSV detalhado exportado' })
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

  it('usa títulos e fallback personalizados quando o erro não tem mensagem', () => {
    const toast = vi.fn()
    runCsvExportWithToast(
      toast,
      () => {
        throw 'falha'
      },
      'O arquivo CSV foi baixado e pode ser aberto no Excel.',
      {
        successTitle: 'Planilha exportada',
        errorTitle: 'Nada para exportar',
        errorFallback: 'Não há dados no período selecionado.',
      },
    )

    expect(toast).toHaveBeenCalledWith({
      title: 'Nada para exportar',
      description: 'Não há dados no período selecionado.',
      variant: 'destructive',
    })
  })
})
