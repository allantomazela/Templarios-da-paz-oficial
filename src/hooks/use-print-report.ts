import { useReactToPrint, type UseReactToPrintOptions } from 'react-to-print'
import { useToast } from '@/hooks/use-toast'
import { logError } from '@/lib/logger'

export interface UsePrintReportOptions {
  contentRef: UseReactToPrintOptions['contentRef']
  documentTitle: string
  pageStyle?: string
  successTitle?: string
  /** Quando ausente, o toast de sucesso exibe apenas o título. */
  successDescription?: string
  errorTitle?: string
  errorDescription?: string
}

export const PRINT_REPORT_DEFAULTS = {
  successTitle: 'Relatório enviado à impressão',
  errorTitle: 'Erro ao imprimir',
  errorDescription: 'Não foi possível gerar o relatório. Tente novamente.',
} as const

/**
 * Envolve `useReactToPrint` com os toasts padrão de sucesso/erro dos relatórios,
 * para que cada tela informe apenas conteúdo, título e mensagens específicas.
 */
export function usePrintReport({
  contentRef,
  documentTitle,
  pageStyle,
  successTitle = PRINT_REPORT_DEFAULTS.successTitle,
  successDescription,
  errorTitle = PRINT_REPORT_DEFAULTS.errorTitle,
  errorDescription = PRINT_REPORT_DEFAULTS.errorDescription,
}: UsePrintReportOptions) {
  const { toast } = useToast()

  return useReactToPrint({
    contentRef,
    documentTitle,
    ...(pageStyle ? { pageStyle } : {}),
    onAfterPrint: () => {
      toast(
        successDescription
          ? { title: successTitle, description: successDescription }
          : { title: successTitle },
      )
    },
    onPrintError: (errorLocation, error) => {
      logError(`Erro ao imprimir "${documentTitle}" (${errorLocation})`, error)
      toast({ title: errorTitle, description: errorDescription, variant: 'destructive' })
    },
  })
}
