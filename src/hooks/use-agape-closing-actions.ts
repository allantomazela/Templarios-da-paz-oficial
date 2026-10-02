import { useState } from 'react'
import type { AgapeBrotherCharge } from '@/lib/data'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useToast } from '@/hooks/use-toast'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { getSaveErrorMessage, isAuthError } from '@/lib/auth-utils'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import useAuthStore from '@/stores/useAuthStore'
import {
  clearAgapeMonthClosing,
  closeAgapeMonth,
  deleteAgapeCharge,
  generateAgapeChargesForMonth,
  reopenAgapeMonth,
  saveAgapeCharge,
  saveAgapeMonthlyTotal,
  type AgapeChargeFormData,
} from '@/lib/agape-payments'

interface UseAgapeClosingActionsParams {
  selectedMonth: number
  selectedYear: number
  monthLabel: string
  selectedCharge: AgapeBrotherCharge | null
  reload: () => Promise<unknown>
  onChargeSaved: () => void
}

/** Operações de escrita do fechamento do ágape (cobranças, total e encerramento). */
export function useAgapeClosingActions({
  selectedMonth,
  selectedYear,
  monthLabel,
  selectedCharge,
  reload,
  onChargeSaved,
}: UseAgapeClosingActionsParams) {
  const { toast } = useToast()
  const signOut = useAuthStore((s) => s.signOut)
  const [deleteTarget, setDeleteTarget] = useState<AgapeBrotherCharge | null>(null)
  const [clearMonthOpen, setClearMonthOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClearingMonth, setIsClearingMonth] = useState(false)

  const handleOperationError = (error: unknown, fallback: string) => {
    if (isAuthError(error)) {
      void signOut()
      return
    }
    toast({
      variant: 'destructive',
      title: 'Operação não concluída',
      description: getSaveErrorMessage(error) || fallback,
    })
  }

  const saveOperation = useAsyncOperation(
    async (data: AgapeChargeFormData) => {
      await saveAgapeCharge(data, {
        chargeId: selectedCharge?.id,
        existingTransactionId: selectedCharge?.transactionId,
      })
      notifyFinancialDataChanged()
      toast({
        title: selectedCharge ? 'Lançamento atualizado' : 'Pagamento registrado',
        description: selectedCharge
          ? 'A cobrança e a tesouraria foram atualizadas.'
          : 'A receita foi lançada na tesouraria.',
      })
      onChargeSaved()
      await reload()
    },
    {
      showSuccessToast: false,
      showErrorToast: false,
      errorMessage: 'Não foi possível salvar o lançamento.',
      onError: (error) =>
        handleOperationError(error, 'Não foi possível salvar o lançamento.'),
    },
  )

  const generateOperation = useAsyncOperation(
    async () => {
      const result = await generateAgapeChargesForMonth(selectedMonth, selectedYear)
      toast({
        title: 'Consumos importados',
        description: `${result.created} nova(s), ${result.updated} atualizada(s). Total dos irmãos: ${formatCurrencyBRL(result.totalConsumed)} (${result.brothersWithConsumption} irmão(s)).`,
      })
      await reload()
    },
    { showSuccessToast: false },
  )

  const closeOperation = useAsyncOperation(
    async () => {
      await closeAgapeMonth(selectedMonth, selectedYear)
      toast({
        title: 'Fechamento encerrado',
        description: `O mês ${monthLabel} foi fechado com sucesso.`,
      })
      await reload()
    },
    { showSuccessToast: false },
  )

  const reopenOperation = useAsyncOperation(
    async () => {
      await reopenAgapeMonth(selectedMonth, selectedYear)
      toast({
        title: 'Fechamento reaberto',
        description: 'O mês pode ser editado novamente.',
      })
      await reload()
    },
    { showSuccessToast: false },
  )

  const saveTotalOperation = useAsyncOperation(
    async (totalBeveragesInput: string) => {
      const value = Number(totalBeveragesInput.replace(',', '.'))
      if (!value || value <= 0) {
        throw new Error('Informe o valor total gasto em bebidas.')
      }
      await saveAgapeMonthlyTotal(selectedMonth, selectedYear, value)
      toast({
        title: 'Total das bebidas salvo',
        description: `Valor de referência do mês: ${formatCurrencyBRL(value)}.`,
      })
      await reload()
    },
    { showSuccessToast: false },
  )

  const confirmClearMonth = async () => {
    setIsClearingMonth(true)
    try {
      const result = await clearAgapeMonthClosing(selectedMonth, selectedYear)
      notifyFinancialDataChanged()
      toast({
        title: 'Mês limpo',
        description: `${result.removed} cobrança(s) removida(s) do fechamento.`,
      })
      setClearMonthOpen(false)
      await reload()
    } catch (error) {
      handleOperationError(error, 'Não foi possível limpar o mês.')
    } finally {
      setIsClearingMonth(false)
    }
  }

  const confirmDeleteCharge = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteAgapeCharge(deleteTarget)
      notifyFinancialDataChanged()
      toast({
        title: 'Lançamento excluído',
        description: deleteTarget.transactionId
          ? 'A cobrança e a receita na tesouraria foram removidas.'
          : 'A cobrança foi removida do fechamento.',
      })
      setDeleteTarget(null)
      await reload()
    } catch (error) {
      handleOperationError(error, 'Não foi possível excluir o lançamento.')
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    saveOperation,
    generateOperation,
    closeOperation,
    reopenOperation,
    saveTotalOperation,
    clearMonth: {
      open: clearMonthOpen,
      setOpen: setClearMonthOpen,
      isClearing: isClearingMonth,
      confirm: confirmClearMonth,
    },
    deleteCharge: {
      target: deleteTarget,
      setTarget: setDeleteTarget,
      isDeleting,
      confirm: confirmDeleteCharge,
    },
  }
}
