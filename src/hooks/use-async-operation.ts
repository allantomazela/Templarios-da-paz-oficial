import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { logError } from '@/lib/logger'

interface UseAsyncOperationOptions {
  /** Mensagem de sucesso customizada */
  successMessage?: string
  /** Mensagem de erro customizada */
  errorMessage?: string
  /** Se deve mostrar toast de sucesso (padrão: true) */
  showSuccessToast?: boolean
  /** Se deve mostrar toast de erro (padrão: true) */
  showErrorToast?: boolean
}

interface UseAsyncOperationReturn<T> {
  /** Estado de carregamento */
  loading: boolean
  /** Erro ocorrido durante a operação */
  error: Error | null
  /** Dados retornados pela operação */
  data: T | null
  /** Função para executar a operação assíncrona */
  execute: (...args: any[]) => Promise<T | null>
  /** Função para resetar o estado */
  reset: () => void
}

/**
 * Hook para gerenciar operações assíncronas com loading, error e toast automáticos
 * 
 * @param operation - Função assíncrona a ser executada
 * @param options - Opções de configuração
 * @returns Objeto com estado e função para executar a operação
 * 
 * @example
 * ```tsx
 * const saveData = useAsyncOperation(
 *   async (data) => {
 *     const response = await api.save(data)
 *     return response
 *   },
 *   {
 *     successMessage: 'Dados salvos com sucesso!',
 *     errorMessage: 'Erro ao salvar dados.'
 *   }
 * )
 * 
 * return (
 *   <Button 
 *     onClick={() => saveData.execute(formData)}
 *     disabled={saveData.loading}
 *   >
 *     {saveData.loading ? 'Salvando...' : 'Salvar'}
 *   </Button>
 * )
 * ```
 */
export function useAsyncOperation<T = unknown>(
  operation: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {},
): UseAsyncOperationReturn<T> {
  const {
    successMessage = 'Operação realizada com sucesso.',
    errorMessage = 'Erro ao realizar operação.',
    showSuccessToast = true,
    showErrorToast = true,
  } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)
  const { toast } = useToast()

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const result = await operation(...args)
        setData(result)

        if (showSuccessToast) {
          toast({
            title: 'Sucesso',
            description: successMessage,
          })
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        logError('Async operation error', error)
        setError(error)

        if (showErrorToast) {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: error instanceof Error ? error.message : errorMessage,
          })
        }

        return null
      } finally {
        setLoading(false)
      }
    },
    [operation, successMessage, errorMessage, showSuccessToast, showErrorToast, toast],
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    loading,
    error,
    data,
    execute,
    reset,
  }
}

