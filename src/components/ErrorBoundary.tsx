import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logError } from '@/lib/logger'

const CHUNK_RELOAD_KEY = 'templarios-chunk-reload'
const STORE_RELOAD_KEY = 'templarios-store-reload'

function isChunkLoadError(error: Error): boolean {
  const msg = error?.message ?? ''
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    (msg.includes('Loading chunk') && msg.includes('failed'))
  )
}

/** Erro "X is not a function" em produção (ex.: Zustand/store minificado) - tenta um reload por cache. */
function isStoreSelectorError(error: Error): boolean {
  const msg = error?.message ?? ''
  return typeof msg === 'string' && msg.includes('is not a function')
}

/** Recarrega a página com cache-bust para forçar novo index e chunks. */
function reloadWithCacheBust(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    }
    const url = new URL(window.location.href)
    url.searchParams.set('_', String(Date.now()))
    window.location.href = url.toString()
  } catch {
    window.location.reload()
  }
}

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('Uncaught error in ErrorBoundary', { error, errorInfo })
    if (typeof sessionStorage === 'undefined') return
    if (isChunkLoadError(error) && sessionStorage.getItem(CHUNK_RELOAD_KEY) !== '1') {
      reloadWithCacheBust()
      return
    }
    if (isStoreSelectorError(error) && sessionStorage.getItem(STORE_RELOAD_KEY) !== '1') {
      sessionStorage.setItem(STORE_RELOAD_KEY, '1')
      reloadWithCacheBust()
    }
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      const err = this.state.error
      const shouldAutoReload =
        (isChunkLoadError(err) && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(CHUNK_RELOAD_KEY) !== '1') ||
        (isStoreSelectorError(err) && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORE_RELOAD_KEY) !== '1')
      if (shouldAutoReload) {
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center min-h-[200px] text-muted-foreground">
            <p className="text-sm">Atualizando a página...</p>
          </div>
        )
      }
      return (
        <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-destructive/5 border-destructive/20 text-center h-full min-h-[200px]">
          <div className="bg-destructive/10 p-3 rounded-full mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Algo deu errado
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-[300px]">
            Não foi possível carregar este componente. Tente recarregar a
            página.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
