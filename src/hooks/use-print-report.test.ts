import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UseReactToPrintOptions } from 'react-to-print'

const toastMock = vi.fn()
const useReactToPrintMock = vi.fn((_options: UseReactToPrintOptions) => vi.fn())

vi.mock('react-to-print', () => ({
  useReactToPrint: (options: UseReactToPrintOptions) => useReactToPrintMock(options),
}))
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}))
vi.mock('@/lib/logger', () => ({ logError: vi.fn() }))

import { PRINT_REPORT_DEFAULTS, usePrintReport } from './use-print-report'

function lastPrintOptions(): UseReactToPrintOptions {
  return useReactToPrintMock.mock.calls.at(-1)![0]
}

const contentRef = { current: null }

describe('usePrintReport', () => {
  beforeEach(() => {
    toastMock.mockClear()
    useReactToPrintMock.mockClear()
  })

  it('repassa conteúdo, título e estilo da página', () => {
    renderHook(() =>
      usePrintReport({ contentRef, documentTitle: 'Relatorio', pageStyle: '@page {}' }),
    )
    const options = lastPrintOptions()
    expect(options.contentRef).toBe(contentRef)
    expect(options.documentTitle).toBe('Relatorio')
    expect(options.pageStyle).toBe('@page {}')
  })

  it('omite pageStyle quando não informado', () => {
    renderHook(() => usePrintReport({ contentRef, documentTitle: 'Relatorio' }))
    expect('pageStyle' in lastPrintOptions()).toBe(false)
  })

  it('exibe apenas o título padrão no sucesso quando não há descrição', () => {
    renderHook(() => usePrintReport({ contentRef, documentTitle: 'Relatorio' }))
    lastPrintOptions().onAfterPrint!()
    expect(toastMock).toHaveBeenCalledWith({ title: PRINT_REPORT_DEFAULTS.successTitle })
  })

  it('usa título e descrição personalizados no sucesso', () => {
    renderHook(() =>
      usePrintReport({
        contentRef,
        documentTitle: 'Relatorio',
        successTitle: 'Extrato enviado',
        successDescription: 'Salve como PDF.',
      }),
    )
    lastPrintOptions().onAfterPrint!()
    expect(toastMock).toHaveBeenCalledWith({
      title: 'Extrato enviado',
      description: 'Salve como PDF.',
    })
  })

  it('exibe toast destrutivo no erro, com mensagens padrão ou personalizadas', () => {
    renderHook(() =>
      usePrintReport({ contentRef, documentTitle: 'Relatorio', errorDescription: 'Falhou.' }),
    )
    lastPrintOptions().onPrintError!('print', new Error('boom'))
    expect(toastMock).toHaveBeenCalledWith({
      title: PRINT_REPORT_DEFAULTS.errorTitle,
      description: 'Falhou.',
      variant: 'destructive',
    })
  })
})
