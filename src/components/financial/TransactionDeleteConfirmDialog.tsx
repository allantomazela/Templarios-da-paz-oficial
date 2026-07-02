import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/format-utils'
import type { Transaction } from '@/lib/data'
import {
  buildTransactionDeleteSuccessMessage,
  deleteFinancialTransactionWithDependencies,
  fetchTransactionDeleteDependencies,
  type TransactionDeleteDependency,
} from '@/lib/financial-transaction-delete'
import { computeTransactionBalanceImpact } from '@/lib/account-reconciliation'
import { cn } from '@/lib/utils'

interface TransactionDeleteConfirmDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (message: string) => void
  onError: (message: string) => void
}

export function TransactionDeleteConfirmDialog({
  transaction,
  open,
  onOpenChange,
  onDeleted,
  onError,
}: TransactionDeleteConfirmDialogProps) {
  const [dependencies, setDependencies] = useState<TransactionDeleteDependency[]>(
    [],
  )
  const [loadingWarnings, setLoadingWarnings] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const balanceImpact = transaction
    ? computeTransactionBalanceImpact(transaction)
    : 0

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDependencies([])
    }
    onOpenChange(nextOpen)
  }

  const loadWarnings = async () => {
    if (!transaction) return
    setLoadingWarnings(true)
    try {
      const rows = await fetchTransactionDeleteDependencies(transaction.id)
      setDependencies(rows)
    } catch {
      setDependencies([])
    } finally {
      setLoadingWarnings(false)
    }
  }

  const handleConfirm = async () => {
    if (!transaction) return
    setSubmitting(true)
    try {
      const result = await deleteFinancialTransactionWithDependencies(transaction.id)
      onDeleted(buildTransactionDeleteSuccessMessage(result))
      handleOpenChange(false)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Falha ao excluir lançamento.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        handleOpenChange(nextOpen)
        if (nextOpen && transaction) {
          void loadWarnings()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              {transaction && (
                <>
                  <p>
                    {transaction.description} —{' '}
                    {formatCurrencyBRL(transaction.amount)}
                  </p>
                  <p>
                    O saldo da conta será ajustado em{' '}
                    <span
                      className={cn(
                        balanceImpact >= 0 ? 'text-green-700' : 'text-destructive',
                        'font-medium',
                      )}
                    >
                      {balanceImpact >= 0 ? '+' : ''}
                      {formatCurrencyBRL(balanceImpact)}
                    </span>
                    .
                  </p>
                </>
              )}

              {loadingWarnings ? (
                <p className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando vínculos...
                </p>
              ) : dependencies.length > 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-900">
                  <p className="font-medium">Vínculos que serão desfeitos:</p>
                  <ul className="mt-1 list-disc pl-4">
                    {dependencies.map((warning) => (
                      <li key={`${warning.source}-${warning.recordId}`}>
                        {warning.label}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs">
                    Pagamentos vinculados voltarão para pendência para evitar que a
                    receita seja recriada automaticamente.
                  </p>
                </div>
              ) : (
                <p className="text-xs">
                  Nenhum vínculo com mensalidades, ágape ou cerimônias.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={submitting || loadingWarnings}
            onClick={(event) => {
              event.preventDefault()
              void handleConfirm()
            }}
          >
            {submitting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
