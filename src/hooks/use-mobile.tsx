/* Use Mobile Hook - matchMedia + useSyncExternalStore (valor correto no 1º paint no cliente; evita flash desktop em telas estreitas) */
import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribeMobile(onStoreChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getMobileSnapshot() {
  return window.matchMedia(QUERY).matches
}

/** SSR / hidratação: assume desktop até o cliente medir (evita mismatch) */
function getServerMobileSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getServerMobileSnapshot,
  )
}
