import { CheckCircle2, Loader2, Lock, Plus, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface AgapeClosingActionsBarProps {
  isReadyToClose: boolean
  isClosed: boolean
  closeDisabledReason: string | null
  canManage: boolean
  canEdit: boolean
  importing: boolean
  onImport: () => void
  onRegisterPayment: () => void
  closingMonth: boolean
  onCloseMonth: () => void
}

/** Aviso de "pronto para encerrar", botões de ação do mês e motivo de bloqueio. */
export function AgapeClosingActionsBar({
  isReadyToClose,
  isClosed,
  closeDisabledReason,
  canManage,
  canEdit,
  importing,
  onImport,
  onRegisterPayment,
  closingMonth,
  onCloseMonth,
}: AgapeClosingActionsBarProps) {
  return (
    <>
      {isReadyToClose && !isClosed && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Pronto para encerrar</AlertTitle>
          <AlertDescription className="text-green-700">
            Consumo, total das bebidas e pagamentos dos irmãos estão conferidos.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <Button
            onClick={onImport}
            disabled={isClosed || importing}
            variant="outline"
          >
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Importar consumos do mês
          </Button>
        )}

        {canEdit && (
          <Button variant="secondary" onClick={onRegisterPayment}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar pagamento
          </Button>
        )}

        {canEdit && (
          <Button
            onClick={onCloseMonth}
            disabled={!isReadyToClose || closingMonth}
          >
            {closingMonth ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Encerrar fechamento
          </Button>
        )}
      </div>

      {closeDisabledReason && !isClosed && (
        <p className="text-sm text-muted-foreground">{closeDisabledReason}</p>
      )}
    </>
  )
}
