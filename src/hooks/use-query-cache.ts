import { useRef, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface QueryCacheOptions {
  /** Tempo de expiração do cache em milissegundos (padrão: 5 minutos) */
  ttl?: number
  /** Chave única para o cache */
  key: string
}

/**
 * Hook para gerenciar cache de queries com TTL (Time To Live)
 * 
 * @param options - Opções de configuração do cache
 * @returns Objeto com funções para gerenciar o cache
 * 
 * @example
 * ```tsx
 * const cache = useQueryCache({ key: 'users-list', ttl: 60000 })
 * 
 * const fetchUsers = async () => {
 *   const cached = cache.get()
 *   if (cached) return cached
 *   
 *   const data = await api.getUsers()
 *   cache.set(data)
 *   return data
 * }
 * ```
 */
export function useQueryCache<T>(options: QueryCacheOptions) {
  const { key, ttl = 5 * 60 * 1000 } = options // 5 minutos padrão
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())

  /**
   * Obtém dados do cache se ainda válidos
   */
  const get = useCallback((): T | null => {
    const entry = cacheRef.current.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now > entry.expiresAt) {
      cacheRef.current.delete(key)
      return null
    }

    return entry.data
  }, [key])

  /**
   * Armazena dados no cache
   */
  const set = useCallback(
    (data: T): void => {
      const now = Date.now()
      cacheRef.current.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      })
    },
    [key, ttl],
  )

  /**
   * Remove entrada específica do cache
   */
  const invalidate = useCallback((): void => {
    cacheRef.current.delete(key)
  }, [key])

  /**
   * Limpa todo o cache
   */
  const clear = useCallback((): void => {
    cacheRef.current.clear()
  }, [])

  /**
   * Verifica se existe cache válido
   */
  const has = useCallback((): boolean => {
    const entry = cacheRef.current.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now > entry.expiresAt) {
      cacheRef.current.delete(key)
      return false
    }

    return true
  }, [key])

  /**
   * Obtém o tempo restante do cache em milissegundos
   */
  const getTimeRemaining = useCallback((): number => {
    const entry = cacheRef.current.get(key)
    if (!entry) return 0

    const now = Date.now()
    const remaining = entry.expiresAt - now
    return remaining > 0 ? remaining : 0
  }, [key])

  return {
    get,
    set,
    invalidate,
    clear,
    has,
    getTimeRemaining,
  }
}

/**
 * Cache global compartilhado entre componentes
 * Útil para cache de dados que não mudam frequentemente
 */
class GlobalQueryCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

/**
 * Instância global do cache para uso em stores e utilitários
 */
export const globalQueryCache = new GlobalQueryCache()

