import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { logError } from '@/lib/logger'
import { toError } from '@/lib/async-utils'

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

/** API antiga: objeto com operation, onSuccess, onError */
interface UseAsyncOperationLegacyOptions {
  operation: (...args: any[]) => Promise<any>
  onSuccess?: () => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
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
function isLegacyOptions(
  op: ((...args: any[]) => Promise<any>) | (UseAsyncOperationOptions & UseAsyncOperationLegacyOptions),
): op is UseAsyncOperationLegacyOptions {
  return (
    typeof op === 'object' &&
    op !== null &&
    'operation' in op &&
    typeof (op as UseAsyncOperationLegacyOptions).operation === 'function'
  )
}

export function useAsyncOperation<T = unknown>(
  operationOrOptions:
    | ((...args: any[]) => Promise<T>)
    | (UseAsyncOperationOptions & UseAsyncOperationLegacyOptions),
  optionsMaybe?: UseAsyncOperationOptions,
): UseAsyncOperationReturn<T> {
  let operation: (...args: any[]) => Promise<T>
  let options: UseAsyncOperationOptions & Partial<UseAsyncOperationLegacyOptions>

  if (isLegacyOptions(operationOrOptions)) {
    operation = operationOrOptions.operation as (...args: any[]) => Promise<T>
    options = operationOrOptions
  } else {
    operation = operationOrOptions
    options = optionsMaybe ?? {}
  }

  const {
    successMessage = 'Operação realizada com sucesso.',
    errorMessage = 'Erro ao realizar operação.',
    showSuccessToast = true,
    showErrorToast = true,
    onSuccess,
    onError,
  } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)
  const inFlightRef = useRef(0)
  const { toast } = useToast()

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      inFlightRef.current += 1
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const result = await operation(...args)
        setData(result)

        if (showSuccessToast && !onSuccess) {
          toast({
            title: 'Sucesso',
            description: successMessage,
          })
        }
        onSuccess?.()

        return result
      } catch (err) {
        const errorObj = toError(err, errorMessage)
        logError('Async operation error', errorObj)
        setError(errorObj)

        if (showErrorToast && !onError) {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: errorObj instanceof Error ? errorObj.message : errorMessage,
          })
        }
        onError?.(errorObj)

        return null
      } finally {
        inFlightRef.current = Math.max(0, inFlightRef.current - 1)
        if (inFlightRef.current === 0) {
          setLoading(false)
        }
      }
    },
    [operation, successMessage, errorMessage, showSuccessToast, showErrorToast, onSuccess, onError, toast],
  )

  const reset = useCallback(() => {
    inFlightRef.current = 0
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

