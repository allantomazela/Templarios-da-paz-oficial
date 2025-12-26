import { usePerformance } from '@/lib/performance'

/**
 * Hook para medir e monitorar performance de operações
 * 
 * @returns Objeto com funções para medir performance
 * 
 * @example
 * ```tsx
 * const perf = usePerformance()
 * 
 * const handleSave = async () => {
 *   await perf.measure('save-user', async () => {
 *     await saveUser(data)
 *   })
 * }
 * 
 * // Ver métricas
 * console.log(perf.getMetrics())
 * perf.log() // Loga tabela de métricas
 * ```
 */
export { usePerformance }

