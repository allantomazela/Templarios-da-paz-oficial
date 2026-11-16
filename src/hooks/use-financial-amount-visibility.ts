import { useCallback, useEffect, useState } from 'react'
import {
  readFinancialAmountsVisible,
  writeFinancialAmountsVisible,
} from '@/lib/financial-amount-visibility'

const VISIBILITY_EVENT = 'financial-amounts-visibility'

/**
 * Preferência compartilhada entre Dashboard e Contas Bancárias
 * (persiste em localStorage e sincroniza entre as abas).
 */
export function useFinancialAmountVisibility() {
  const [amountsVisible, setAmountsVisible] = useState(
    readFinancialAmountsVisible,
  )

  useEffect(() => {
    function syncFromStorage() {
      setAmountsVisible(readFinancialAmountsVisible())
    }

    window.addEventListener('storage', syncFromStorage)
    window.addEventListener(VISIBILITY_EVENT, syncFromStorage)
    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener(VISIBILITY_EVENT, syncFromStorage)
    }
  }, [])

  const toggleAmountsVisible = useCallback(() => {
    setAmountsVisible((prev) => {
      const next = !prev
      writeFinancialAmountsVisible(next)
      window.dispatchEvent(new Event(VISIBILITY_EVENT))
      return next
    })
  }, [])

  return { amountsVisible, toggleAmountsVisible }
}
