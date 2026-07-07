import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'

const EDGE_FUNCTION_UNAVAILABLE_MESSAGE =
  'Serviço de lembretes indisponível. A Edge Function pode não estar publicada no Supabase — consulte a documentação de deploy.'

/** Mensagem amigável para falhas de invoke (rede, CORS, 5xx). */
export function formatEdgeFunctionInvokeError(error: unknown): string {
  if (error instanceof FunctionsFetchError) {
    return EDGE_FUNCTION_UNAVAILABLE_MESSAGE
  }

  if (error instanceof FunctionsRelayError) {
    return error.message || EDGE_FUNCTION_UNAVAILABLE_MESSAGE
  }

  if (error instanceof FunctionsHttpError) {
    const context = error.context as { status?: number } | undefined
    if (context?.status === 404) {
      return 'Função não encontrada no servidor. Publique a Edge Function no Supabase.'
    }
    if (context?.status === 401 || context?.status === 403) {
      return 'Sem permissão ou sessão expirada. Faça login novamente.'
    }
    return error.message || 'Erro ao chamar o serviço remoto.'
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (
      message.includes('cors') ||
      message.includes('failed to fetch') ||
      message.includes('network')
    ) {
      return EDGE_FUNCTION_UNAVAILABLE_MESSAGE
    }
    return error.message
  }

  return 'Erro ao chamar o serviço remoto.'
}
