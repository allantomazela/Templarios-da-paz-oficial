import type { toast as toastFn } from '@/hooks/use-toast'

/** Executa uma exportação CSV e informa o resultado ao usuário por toast. */
export function runCsvExportWithToast(
  toast: typeof toastFn,
  exportCsv: () => void,
  successDescription: string,
): void {
  try {
    exportCsv()
    toast({ title: 'CSV exportado', description: successDescription })
  } catch (error) {
    toast({
      title: 'Erro ao exportar',
      description: error instanceof Error ? error.message : 'Falha na exportação.',
      variant: 'destructive',
    })
  }
}
