import { useState, useEffect, useCallback } from 'react'
import { globalQueryCache } from './use-query-cache'

interface UseCachedQueryOptions<T> {
  /** Chave única para o cache */
  cacheKey: string
  /** Função para buscar dados (será chamada se não houver cache) */
  queryFn: () => Promise<T>
  /** Tempo de expiração do cache em milissegundos (padrão: 5 minutos) */
  ttl?: number
  /** Se deve buscar dados imediatamente (padrão: true) */
  enabled?: boolean
  /** Se deve usar cache (padrão: true) */
  useCache?: boolean
}

interface UseCachedQueryReturn<T> {
  /** Dados retornados pela query */
  data: T | null
  /** Estado de carregamento */
  isLoading: boolean
  /** Erro ocorrido */
  error: Error | null
  /** Função para refetch dos dados */
  refetch: () => Promise<void>
  /** Função para invalidar o cache */
  invalidate: () => void
}

/**
 * Hook para fazer queries com cache automático
 * 
 * @param options - Opções de configuração da query
 * @returns Objeto com dados, loading, error e funções de controle
 * 
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useCachedQuery({
 *   cacheKey: 'users-list',
 *   queryFn: async () => {
 *     const { data } = await supabase.from('users').select('*')
 *     return data
 *   },
 *   ttl: 60000 // 1 minuto
 * })
 * ```
 */
export function useCachedQuery<T>(
  options: UseCachedQueryOptions<T>,
): UseCachedQueryReturn<T> {
  const {
    cacheKey,
    queryFn,
    ttl = 5 * 60 * 1000, // 5 minutos padrão
    enabled = true,
    useCache = true,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async (skipCache = false) => {
    // Verificar cache primeiro
    if (useCache && !skipCache) {
      const cached = globalQueryCache.get<T>(cacheKey)
      if (cached) {
        setData(cached)
        setError(null)
        return
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      setData(result)

      // Armazenar no cache
      if (useCache) {
        globalQueryCache.set(cacheKey, result, ttl)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey, queryFn, ttl, useCache])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cacheKey])

  const refetch = useCallback(async () => {
    await fetchData(true) // Skip cache on refetch
  }, [fetchData])

  const invalidate = useCallback(() => {
    globalQueryCache.invalidate(cacheKey)
    setData(null)
  }, [cacheKey])

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
  }
}

