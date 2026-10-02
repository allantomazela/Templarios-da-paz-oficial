import { useMemo, useState } from 'react'
import type { Contribution } from '@/lib/data'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  saveContribution,
  type ApprovedBrotherOption,
  type ContributionFormData,
} from '@/lib/contribution-payments'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'

/**
 * Estado do diálogo de mensalidade (novo lançamento ou edição) e o salvamento,
 * incluindo o pré-preenchimento vindo do cronograma.
 */
export function useMembershipContributionLaunch({
  selectedBrotherId,
  setSelectedBrotherId,
  approvedBrothers,
  brotherNames,
  allSchedules,
  resolveBrotherName,
  refreshContributions,
}: UseMembershipContributionLaunchParams) {
  const dialog = useDialog()
  const [contributionLaunch, setContributionLaunch] = useState<ContributionLaunch | null>(null)
  const [selectedContribution, setSelectedContribution] =
    useState<Contribution | null>(null)

  const launchOpenMonthsCount = useMemo(() => {
    const brotherId = contributionLaunch?.brotherId || selectedBrotherId
    if (!brotherId) return 0
    return allSchedules.find((schedule) => schedule.brotherId === brotherId)
      ?.openEntries.length ?? 0
  }, [contributionLaunch?.brotherId, selectedBrotherId, allSchedules])

  const saveOperation = useAsyncOperation(
    async (formData: ContributionFormData) => {
      const brotherName =
        formData.brotherName ||
        brotherNames[formData.brotherId] ||
        approvedBrothers.find((b) => b.id === formData.brotherId)?.full_name ||
        ''

      await saveContribution(
        { ...formData, brotherName },
        selectedContribution
          ? {
              contributionId: selectedContribution.id,
              existingTransactionId: selectedContribution.transactionId,
            }
          : undefined,
      )

      await refreshContributions()
      notifyFinancialDataChanged()
      return selectedContribution
        ? 'Mensalidade atualizada com sucesso.'
        : 'Mensalidade registrada com sucesso.'
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a mensalidade.',
    },
  )

  const openNew = (
    brotherId?: string,
    prefill?: { brotherName?: string; month: string; year: number },
  ) => {
    const id = brotherId ?? selectedBrotherId
    setSelectedContribution(null)
    setContributionLaunch({
      brotherId: id,
      brotherName:
        prefill?.brotherName?.trim() || resolveBrotherName(id),
      month: prefill?.month,
      year: prefill?.year,
    })
    if (brotherId) setSelectedBrotherId(brotherId)
    dialog.openDialog()
  }

  const openEdit = (contribution: Contribution) => {
    setContributionLaunch({
      brotherId: contribution.brotherId,
      brotherName:
        contribution.brotherName?.trim() ||
        resolveBrotherName(contribution.brotherId),
    })
    setSelectedContribution(contribution)
    setSelectedBrotherId(contribution.brotherId)
    dialog.openDialog()
  }

  const handleSave = async (formData: ContributionFormData) => {
    const result = await saveOperation.execute(formData)
    if (result) dialog.closeDialog()
  }

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) setContributionLaunch(null)
    dialog.onOpenChange(next)
  }

  return {
    dialogOpen: dialog.open,
    handleDialogOpenChange,
    contributionLaunch,
    selectedContribution,
    launchOpenMonthsCount,
    saving: saveOperation.loading,
    openNew,
    openEdit,
    handleSave,
  }
}

interface ContributionLaunch {
  brotherId: string
  brotherName: string
  month?: string
  year?: number
}

interface UseMembershipContributionLaunchParams {
  selectedBrotherId: string
  setSelectedBrotherId: (brotherId: string) => void
  approvedBrothers: ApprovedBrotherOption[]
  brotherNames: Record<string, string>
  allSchedules: BrotherMembershipSchedule[]
  resolveBrotherName: (brotherId: string) => string
  refreshContributions: () => Promise<void>
}
