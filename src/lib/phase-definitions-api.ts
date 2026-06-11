import { supabase } from '@/lib/supabase/client'
import { withTimeout, toError } from '@/lib/async-utils'
import { SECRETARIAT_OP_TIMEOUT_MS } from '@/lib/secretariat/constants'

const TIMEOUT_MSG =
  'Operação demorou demais. Verifique sua conexão e tente novamente.'

export type PhaseDefinitionSaveInput = {
  name: string
  description?: string
  order: number
}

export async function createPhaseDefinition(
  data: PhaseDefinitionSaveInput,
): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await withTimeout(
    supabaseAny.from('sindicancia_phase_definitions').insert({
      name: data.name,
      description: data.description ?? null,
      order: data.order,
    }),
    SECRETARIAT_OP_TIMEOUT_MS,
    'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao adicionar a fase.')
  }
}

export async function updatePhaseDefinition(
  id: string,
  data: PhaseDefinitionSaveInput,
): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await withTimeout(
    supabaseAny
      .from('sindicancia_phase_definitions')
      .update({
        name: data.name,
        description: data.description ?? null,
        order: data.order,
      })
      .eq('id', id),
    SECRETARIAT_OP_TIMEOUT_MS,
    'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao atualizar a fase.')
  }
}

export async function deletePhaseDefinition(id: string): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await withTimeout(
    supabaseAny.from('sindicancia_phase_definitions').delete().eq('id', id),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    throw toError(error, 'Falha ao excluir a fase.')
  }
}
