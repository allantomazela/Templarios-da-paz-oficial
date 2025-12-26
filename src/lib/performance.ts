/**
 * Utilitários para métricas de performance
 * Coleta métricas básicas sem interferir no funcionamento da aplicação
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, unknown>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 100 // Limitar quantidade de métricas armazenadas
  private enabled = import.meta.env.DEV // Apenas em desenvolvimento por padrão

  /**
   * Habilita ou desabilita a coleta de métricas
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Verifica se a coleta está habilitada
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Mede o tempo de execução de uma função
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.enabled) {
      return fn()
    }

    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration, metadata)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(name, duration, { ...metadata, error: true })
      throw error
    }
  }

  /**
   * Mede o tempo de execução de uma função síncrona
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>,
  ): T {
    if (!this.enabled) {
      return fn()
    }

    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration, metadata)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(name, duration, { ...metadata, error: true })
      throw error
    }
  }

  /**
   * Registra uma métrica manualmente
   */
  recordMetric(
    name: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.enabled) return

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    })

    // Limitar quantidade de métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  /**
   * Obtém todas as métricas coletadas
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Obtém métricas filtradas por nome
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Obtém estatísticas de uma métrica específica
   */
  getStats(name: string): {
    count: number
    avg: number
    min: number
    max: number
    total: number
  } | null {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return null

    const durations = metrics.map((m) => m.duration)
    const total = durations.reduce((sum, d) => sum + d, 0)
    const avg = total / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    return {
      count: metrics.length,
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }

  /**
   * Limpa todas as métricas
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Exporta métricas como JSON
   */
  export(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        summary: this.getSummary(),
      },
      null,
      2,
    )
  }

  /**
   * Obtém resumo de todas as métricas
   */
  getSummary(): Record<string, ReturnType<typeof this.getStats>> {
    const uniqueNames = Array.from(new Set(this.metrics.map((m) => m.name)))
    const summary: Record<string, ReturnType<typeof this.getStats>> = {}

    for (const name of uniqueNames) {
      const stats = this.getStats(name)
      if (stats) {
        summary[name] = stats
      }
    }

    return summary
  }

  /**
   * Loga métricas no console (apenas em desenvolvimento)
   */
  logMetrics(): void {
    if (!this.enabled || !import.meta.env.DEV) return

    const summary = this.getSummary()
    console.group('📊 Performance Metrics')
    console.table(summary)
    console.groupEnd()
  }
}

/**
 * Instância global do monitor de performance
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * Hook para medir performance de operações
 * 
 * @example
 * ```tsx
 * const measure = usePerformance()
 * 
 * const handleSave = async () => {
 *   await measure('save-data', async () => {
 *     await api.save(data)
 *   })
 * }
 * ```
 */
export function usePerformance() {
  return {
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    record: performanceMonitor.recordMetric.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    log: performanceMonitor.logMetrics.bind(performanceMonitor),
  }
}

// Expor no window para debug (apenas em desenvolvimento)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as any).__performanceMonitor = performanceMonitor
}

