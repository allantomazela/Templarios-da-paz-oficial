import type { toast as toastFn } from '@/hooks/use-toast'

export interface CsvExportToastOptions {
  successTitle?: string
  errorTitle?: string
  /** Usado quando o erro não traz mensagem própria. */
  errorFallback?: string
}

/** Mensagens dos relatórios que exportam "planilha" (agenda, ágape, planejamento). */
export const SPREADSHEET_EXPORT_DESCRIPTION =
  'O arquivo CSV foi baixado e pode ser aberto no Excel.'

export const SPREADSHEET_EXPORT_TITLES = {
  successTitle: 'Planilha exportada',
  errorTitle: 'Nada para exportar',
} as const satisfies CsvExportToastOptions

/**
 * Executa uma exportação CSV e informa o resultado ao usuário por toast.
 * Funções de exportação sinalizam "nada para exportar" lançando um Error com a
 * mensagem a exibir, por isso a mensagem do erro tem prioridade sobre o fallback.
 */
export function runCsvExportWithToast(
  toast: typeof toastFn,
  exportCsv: () => void,
  successDescription?: string,
  {
    successTitle = 'CSV exportado',
    errorTitle = 'Erro ao exportar',
    errorFallback = 'Falha na exportação.',
  }: CsvExportToastOptions = {},
): void {
  try {
    exportCsv()
    toast(
      successDescription
        ? { title: successTitle, description: successDescription }
        : { title: successTitle },
    )
  } catch (error) {
    toast({
      title: errorTitle,
      description: error instanceof Error && error.message ? error.message : errorFallback,
      variant: 'destructive',
    })
  }
}
