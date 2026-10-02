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
import type { MembershipAmountReduction } from '@/lib/membership-amount-check'
import { formatCurrencyBRL } from '@/lib/format-utils'

interface ContributionAmountReductionConfirmProps {
  reduction: MembershipAmountReduction | null
  periodText: string
  onCancel: () => void
  onConfirm: () => void
}

export function ContributionAmountReductionConfirm({
  reduction,
  periodText,
  onCancel,
  onConfirm,
}: ContributionAmountReductionConfirmProps) {
  return (
    <AlertDialog
      open={reduction !== null}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reduzir o valor desta mensalidade?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              {reduction ? (
                <>
                  <p>
                    O valor vai de{' '}
                    <strong>{formatCurrencyBRL(reduction.previousAmount)}</strong>{' '}
                    para <strong>{formatCurrencyBRL(reduction.newAmount)}</strong>.
                    A mensalidade de <strong>{periodText}</strong> deixará de
                    constar como paga e ficará em aberto (faltam{' '}
                    {formatCurrencyBRL(reduction.missingAmount)}).
                  </p>
                  <p>
                    Se esse valor for de lanche ou outra compra, volte, mantenha a
                    mensalidade como está e registre a compra em{' '}
                    <strong>Vendas do Templo</strong>.
                  </p>
                </>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar e corrigir</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Reduzir mesmo assim</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
