import { supabase } from '@/lib/supabase/client'
import type { Brother } from '@/lib/data'
import type { MasonicDegree } from '@/lib/masonic-degree'

export interface BrotherDegreeInfoInput {
  degree: MasonicDegree
  initiationDate: string
  elevationDate: string
  exaltationDate: string
}

function toNullableDate(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

/**
 * Grava grau e datas pela RPC da Chancelaria (a tabela brothers só aceita
 * escrita direta da Secretaria). Data de iniciação vazia mantém a atual.
 */
export async function saveBrotherDegreeInfo(
  brotherId: string,
  input: BrotherDegreeInfoInput,
): Promise<Partial<Brother>> {
  const initiationDate = toNullableDate(input.initiationDate)
  const elevationDate = toNullableDate(input.elevationDate)
  const exaltationDate = toNullableDate(input.exaltationDate)

  const { error } = await supabase.rpc('update_brother_degree_info', {
    p_brother_id: brotherId,
    p_degree: input.degree,
    p_initiation_date: initiationDate,
    p_elevation_date: elevationDate,
    p_exaltation_date: exaltationDate,
  })

  if (error) {
    throw new Error(error.message || 'Não foi possível salvar o grau do irmão.')
  }

  return {
    degree: input.degree,
    ...(initiationDate ? { initiationDate } : {}),
    elevationDate: elevationDate ?? undefined,
    exaltationDate: exaltationDate ?? undefined,
  }
}
