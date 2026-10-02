import { useEffect, useState } from 'react'
import { fetchApprovedBrothers, fetchBankAccounts } from '@/lib/contribution-payments'
import type { BrotherOption } from '@/components/financial/BrotherSearchCombobox'

interface ContributionDialogOptions {
  brothers: BrotherOption[]
  accounts: { id: string; name: string }[]
  loadingOptions: boolean
}

/** Irmãos e contas bancárias do formulário de mensalidade (recarrega ao abrir). */
export function useContributionDialogOptions(
  open: boolean,
  brothersProp?: BrotherOption[],
): ContributionDialogOptions {
  const [brothers, setBrothers] = useState<BrotherOption[]>([])
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    if (!open) return

    const loadOptions = async () => {
      if (brothersProp && brothersProp.length > 0) {
        setBrothers(brothersProp)
      }

      setLoadingOptions(true)
      try {
        const [brothersData, accountsData] = await Promise.all([
          brothersProp && brothersProp.length > 0
            ? Promise.resolve(brothersProp)
            : fetchApprovedBrothers(),
          fetchBankAccounts(),
        ])
        setBrothers(brothersData)
        setAccounts(accountsData)
      } catch (error) {
        console.error('Erro ao carregar opções:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()
  }, [open, brothersProp])

  return { brothers, accounts, loadingOptions }
}
