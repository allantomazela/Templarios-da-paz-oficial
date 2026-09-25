import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useRedirectsStore from '@/stores/useRedirectsStore'
import { logDebug } from '@/lib/logger'

/**
 * Aplica redirecionamentos 301/302 configurados no Admin.
 * O fetch é adiado para idle/após paint para não competir com auth/settings no boot.
 */
export function RedirectHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  const { redirects, fetchRedirects } = useRedirectsStore()

  useEffect(() => {
    let cancelled = false
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const run = () => {
      if (!cancelled) void fetchRedirects()
    }

    const ric = (
      window as Window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number
        cancelIdleCallback?: (id: number) => void
      }
    ).requestIdleCallback

    if (typeof ric === 'function') {
      idleId = ric(run, { timeout: 2000 })
    } else {
      timeoutId = setTimeout(run, 150)
    }

    return () => {
      cancelled = true
      if (idleId != null) {
        window.cancelIdleCallback?.(idleId)
      }
      if (timeoutId != null) clearTimeout(timeoutId)
    }
  }, [fetchRedirects])

  useEffect(() => {
    if (redirects.length === 0) return

    const currentPath = location.pathname
    const match = redirects.find(
      (r) =>
        r.source_path === currentPath ||
        (r.source_path.endsWith('/')
          ? r.source_path.slice(0, -1) === currentPath
          : r.source_path === currentPath),
    )

    if (match) {
      logDebug(`Redirecting from ${currentPath} to ${match.target_path}`)
      navigate(match.target_path, { replace: true })
    }
  }, [location.pathname, redirects, navigate])

  return null
}
