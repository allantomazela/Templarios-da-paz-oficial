import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

interface UseModuleActivationOptions {
  /** Recarrega ao voltar ao app/aba no mobile (Page Visibility API). */
  refreshOnVisible?: boolean
}

/**
 * Executa `onActivate` quando o módulo (prefixo de rota) fica ativo
 * e opcionalmente ao retornar a visibilidade da página.
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

  useEffect(() => {
    if (!isActive) return
    void onActivateRef.current()
  }, [isActive, location.pathname])

  useEffect(() => {
    if (!options?.refreshOnVisible) return

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (!window.location.pathname.startsWith(modulePathPrefix)) return
      void onActivateRef.current()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [modulePathPrefix, options?.refreshOnVisible])
}
