import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import type { AgapeBrotherCharge } from '@/lib/data'
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
import { formatCurrencyBRL } from '@/lib/format-utils'

interface AgapeClearMonthDialogProps {
  open: boolean
  monthLabel: string
  clearing: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function AgapeClearMonthDialog({
  open,
  monthLabel,
  clearing,
  onCancel,
  onConfirm,
}: AgapeClearMonthDialogProps) {
  return (
    <DestructiveConfirmDialog
      open={open}
      busy={clearing}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Limpar todos os lançamentos do mês?"
      confirmLabel="Limpar mês"
    >
      Serão excluídas todas as cobranças de <strong>{monthLabel}</strong> e as
      receitas vinculadas na tesouraria. O total das bebidas será zerado. Use para
      recomeçar o fechamento deste mês.
    </DestructiveConfirmDialog>
  )
}

interface AgapeDeleteChargeDialogProps {
  target: AgapeBrotherCharge | null
  brotherNames: Record<string, string>
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function AgapeDeleteChargeDialog({
  target,
  brotherNames,
  deleting,
  onCancel,
  onConfirm,
}: AgapeDeleteChargeDialogProps) {
  return (
    <DestructiveConfirmDialog
      open={!!target}
      busy={deleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Excluir lançamento do fechamento?"
      confirmLabel="Excluir"
    >
      {target ? (
        <>
          Você está prestes a excluir a cobrança de{' '}
          <strong>
            {brotherNames[target.brotherId] || target.brotherName || 'irmão'}
          </strong>{' '}
          ({formatCurrencyBRL(target.amount)}).
          {target.transactionId ? (
            <> A receita vinculada na tesouraria também será removida.</>
          ) : null}{' '}
          Esta ação não pode ser desfeita.
        </>
      ) : null}
    </DestructiveConfirmDialog>
  )
}

function DestructiveConfirmDialog({
  open,
  busy,
  onCancel,
  onConfirm,
  title,
  confirmLabel,
  children,
}: {
  open: boolean
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  confirmLabel: string
  children: ReactNode
}) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && !busy && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{children}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
