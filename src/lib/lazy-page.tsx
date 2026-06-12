import { ComponentType, Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'

function PublicPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

/** Lazy load para páginas públicas (fora do dashboard), com Suspense próprio. */
export function lazyPublicPage<T extends ComponentType<object>>(
  factory: () => Promise<{ default: T }>,
) {
  const LazyComponent = lazy(factory)

  return function LazyPublicPage() {
    return (
      <Suspense fallback={<PublicPageLoader />}>
        <LazyComponent />
      </Suspense>
    )
  }
}
