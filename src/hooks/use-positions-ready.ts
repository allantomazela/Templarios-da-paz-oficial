import { useEffect, useState } from 'react'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'

const POSITIONS_READY_TIMEOUT_MS = 8_000

/**
 * Evita tela presa em "Carregando módulo" quando fetchPositions demora ou falha.
 * Após o timeout, libera a UI mesmo sem initialized=true.
 */
export function usePositionsReady() {
  const positionsInitialized = useLodgePositionsStore((state) => state.initialized)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (positionsInitialized) {
      setTimedOut(false)
      return
    }

    const timer = window.setTimeout(() => {
      setTimedOut(true)
    }, POSITIONS_READY_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [positionsInitialized])

  return positionsInitialized || timedOut
}
