import { supabase } from '@/lib/supabase/client'
import { withTimeout, toError } from '@/lib/async-utils'
import { SECRETARIAT_OP_TIMEOUT_MS } from '@/lib/secretariat/constants'

export interface AgapeResetResult {
  transactionsRemoved: number
  chargesRemoved: number
  closingsRemoved: number
  consumptionsRemoved: number
  sessionsRemoved: number
  menuItemsRemoved: number
}

export async function resetAgapeOperationalData(): Promise<AgapeResetResult> {
  return withTimeout(
    resetAgapeOperationalDataInternal(),
    SECRETARIAT_OP_TIMEOUT_MS,
    'A limpeza do módulo Ágape demorou demais. Tente novamente.',
  )
}

async function resetAgapeOperationalDataInternal(): Promise<AgapeResetResult> {
  const supabaseAny = supabase as {
    rpc: (
      fn: string,
    ) => Promise<{ data: unknown; error: { message?: string } | null }>
  }

  const { data, error } = await supabaseAny.rpc('reset_agape_operational_data')

  if (error) {
    throw toError(error, 'Não foi possível resetar os dados do Ágape.')
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') {
    throw new Error('Resposta inválida ao resetar o módulo Ágape.')
  }

  const r = row as Record<string, number>
  return {
    transactionsRemoved: Number(r.transactions_removed ?? 0),
    chargesRemoved: Number(r.charges_removed ?? 0),
    closingsRemoved: Number(r.closings_removed ?? 0),
    consumptionsRemoved: Number(r.consumptions_removed ?? 0),
    sessionsRemoved: Number(r.sessions_removed ?? 0),
    menuItemsRemoved: Number(r.menu_items_removed ?? 0),
  }
}
