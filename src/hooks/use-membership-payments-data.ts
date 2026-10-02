import { useEffect, useMemo, useState } from 'react'
import type { Contribution } from '@/lib/data'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import useFinancialStore, { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  buildBrotherSummaries,
  deleteContribution,
  fetchApprovedBrothers,
  fetchMembershipFeeSettings,
  filterContributionsByBrother,
  type ApprovedBrotherOption,
  type MembershipFeeSettings,
} from '@/lib/contribution-payments'
import {
  buildAllMembershipSchedules,
  buildMembershipScheduleForBrother,
  buildOverdueBrotherAlerts,
  contributionCountsInTreasury,
} from '@/lib/membership-schedule'

const INITIAL_FEE_SETTINGS: MembershipFeeSettings = {
  defaultAmount: 290,
  dueDay: 10,
  baseAmount: 200,
  sessionPackageAmount: 90,
}

function buildBrotherNamesMap(
  brothers: ApprovedBrotherOption[],
  contributions: Contribution[],
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const brother of brothers) {
    if (brother.full_name?.trim()) {
      map[brother.id] = brother.full_name.trim()
    }
  }
  for (const contribution of contributions) {
    const name = contribution.brotherName?.trim()
    if (name && !map[contribution.brotherId]) {
      map[contribution.brotherId] = name
    }
  }
  return map
}

/**
 * Dados da tela de Mensalidades: irmãos aprovados, configuração de valores,
 * cronogramas, alertas de atraso e o recorte do irmão selecionado.
 */
export function useMembershipPaymentsData() {
  const updateMembershipFeeSettings = useSiteSettingsStore(
    (s) => s.updateMembershipFeeSettings,
  )
  const contributions = useFinancialStore((s) => s.contributions)
  const financialLoading = useFinancialStore((s) => s.loading)
  const fetchStoreContributions = useFinancialStore((s) => s.fetchContributions)
  const [approvedBrothers, setApprovedBrothers] = useState<ApprovedBrotherOption[]>([])
  const [brothersLoading, setBrothersLoading] = useState(true)
  const [selectedBrotherId, setSelectedBrotherId] = useState('')
  const [feeSettings, setFeeSettings] = useState(INITIAL_FEE_SETTINGS)

  const brotherNames = useMemo(
    () => buildBrotherNamesMap(approvedBrothers, contributions),
    [approvedBrothers, contributions],
  )

  const loading =
    brothersLoading || (financialLoading && contributions.length === 0)

  const refreshContributions = async () => {
    await fetchStoreContributions()
  }

  const loadBrothers = useAsyncOperation(
    async () => {
      setBrothersLoading(true)
      const brothers = await fetchApprovedBrothers()
      setApprovedBrothers(brothers)
      setSelectedBrotherId((current) => current || brothers[0]?.id || '')
      setBrothersLoading(false)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar irmãos.',
    },
  )

  useEffect(() => {
    void loadBrothers.execute()
    fetchMembershipFeeSettings()
      .then(setFeeSettings)
      .catch(() => {})
    if (contributions.length === 0) {
      void fetchStoreContributions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summaries = useMemo(
    () => buildBrotherSummaries(contributions, brotherNames, approvedBrothers),
    [contributions, brotherNames, approvedBrothers],
  )

  const allSchedules = useMemo(
    () =>
      buildAllMembershipSchedules(
        contributions,
        approvedBrothers,
        brotherNames,
        feeSettings,
      ),
    [contributions, approvedBrothers, brotherNames, feeSettings],
  )

  const overdueAlerts = useMemo(
    () => buildOverdueBrotherAlerts(allSchedules),
    [allSchedules],
  )

  const selectedSchedule = useMemo(() => {
    if (!selectedBrotherId) return null
    const brother = approvedBrothers.find((b) => b.id === selectedBrotherId)
    const name =
      brotherNames[selectedBrotherId] || brother?.full_name || 'Sem nome'
    return buildMembershipScheduleForBrother(
      selectedBrotherId,
      name,
      contributions,
      feeSettings,
      brother?.created_at,
      brother?.membershipSituation,
    )
  }, [
    selectedBrotherId,
    approvedBrothers,
    brotherNames,
    contributions,
    feeSettings,
  ])

  const selectedSummary = summaries.find((s) => s.brotherId === selectedBrotherId)
  const brotherHistory = useMemo(
    () => filterContributionsByBrother(contributions, selectedBrotherId),
    [contributions, selectedBrotherId],
  )

  const treasuryPaidTotal = useMemo(() => {
    return brotherHistory
      .filter((c) => contributionCountsInTreasury(c))
      .reduce((sum, c) => sum + c.amount, 0)
  }, [brotherHistory])

  const deleteOperation = useAsyncOperation(
    async (contribution: Contribution) => {
      await deleteContribution(contribution)
      await refreshContributions()
      notifyFinancialDataChanged()
      return 'Mensalidade removida.'
    },
    {
      successMessage: 'Mensalidade removida com sucesso!',
      errorMessage: 'Falha ao remover a mensalidade.',
    },
  )

  const resolveBrotherName = (brotherId: string) => {
    if (!brotherId) return ''
    return (
      brotherNames[brotherId]?.trim() ||
      approvedBrothers.find((b) => b.id === brotherId)?.full_name?.trim() ||
      ''
    )
  }

  const handleUpdateFeeSettings = async (next: MembershipFeeSettings) => {
    await updateMembershipFeeSettings(next)
    setFeeSettings(next)
  }

  return {
    contributions,
    approvedBrothers,
    brotherNames,
    loading,
    feeSettings,
    selectedBrotherId,
    setSelectedBrotherId,
    allSchedules,
    overdueAlerts,
    selectedSchedule,
    selectedSummary,
    brotherHistory,
    treasuryPaidTotal,
    deleteOperation,
    refreshContributions,
    resolveBrotherName,
    handleUpdateFeeSettings,
  }
}
