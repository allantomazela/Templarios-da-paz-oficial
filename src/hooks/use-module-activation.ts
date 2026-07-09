import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Intervalo mínimo entre recargas por visibilidade (evita refetch ao alternar abas). */
export const DEFAULT_MODULE_VISIBILITY_REFRESH_TTL_MS = 2 * 60 * 1000

interface UseModuleActivationOptions {
  /** Recarrega ao voltar ao app/aba no mobile (Page Visibility API). */
  refreshOnVisible?: boolean
  /**
   * Tempo mínimo entre recargas por visibilidade (ms).
   * Padrão: 2 minutos. Use 0 para manter o comportamento antigo (sempre recarregar).
   */
  visibilityRefreshTtlMs?: number
}

/**
 * Executa `onActivate` quando o módulo (prefixo de rota) fica ativo
 * e opcionalmente ao retornar a visibilidade da página (com TTL).
 */
export function useModuleActivation(
  modulePathPrefix: string,
  onActivate: () => void | Promise<void>,
  options?: UseModuleActivationOptions,
): void {
  const location = useLocation()
  const isActive = location.pathname.startsWith(modulePathPrefix)
  const onActivateRef = useRef(onActivate)
  onActivateRef.current = onActivate
  const lastActivateAtRef = useRef(0)

  const runActivate = () => {
    lastActivateAtRef.current = Date.now()
    void onActivateRef.current()
  }

  useEffect(() => {
    if (!isActive) return
    runActivate()
  }, [isActive, location.pathname])

  useEffect(() => {
    if (!options?.refreshOnVisible) return

    const ttlMs =
      options.visibilityRefreshTtlMs ?? DEFAULT_MODULE_VISIBILITY_REFRESH_TTL_MS

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (!window.location.pathname.startsWith(modulePathPrefix)) return

      const elapsed = Date.now() - lastActivateAtRef.current
      if (ttlMs > 0 && elapsed < ttlMs) return

      runActivate()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [
    modulePathPrefix,
    options?.refreshOnVisible,
    options?.visibilityRefreshTtlMs,
  ])
}
