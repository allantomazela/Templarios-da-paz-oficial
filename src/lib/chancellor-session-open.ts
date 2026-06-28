import type { Event } from '@/lib/data'
import { supabase } from '@/lib/supabase/client'
import {
  buildAgapeSessionFromAgendaEvent,
  isAgapeImportableEventType,
} from '@/lib/agape-agenda-import'

export type EnsureAgapeSessionResult =
  | { action: 'none'; reason: 'event_type_not_importable' }
  | { action: 'already_open' }
  | { action: 'reopened' }
  | { action: 'created' }
  | { action: 'skipped_finalized' }

/** Abre ou cria sessão de ágape vinculada ao evento da agenda (Sessão / Evento Social). */
export async function ensureAgapeSessionOpenForEvent(
  event: Event,
): Promise<EnsureAgapeSessionResult> {
  if (!isAgapeImportableEventType(event.type)) {
    return { action: 'none', reason: 'event_type_not_importable' }
  }

  const supabaseAny = supabase as any
  const { data: existing, error: fetchError } = await supabaseAny
    .from('agape_sessions')
    .select('id, status')
    .eq('event_id', event.id)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing?.status === 'open') {
    return { action: 'already_open' }
  }

  if (existing?.status === 'finalized') {
    return { action: 'skipped_finalized' }
  }

  if (existing?.id) {
    const { error: updateError } = await supabaseAny
      .from('agape_sessions')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (updateError) throw updateError
    return { action: 'reopened' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const payload = buildAgapeSessionFromAgendaEvent({
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    type: event.type,
    description: event.description,
    location: event.location,
  })

  const { error: insertError } = await supabaseAny.from('agape_sessions').insert({
    ...payload,
    created_by: user?.id ?? null,
  })

  if (insertError) throw insertError
  return { action: 'created' }
}

export function describeAgapeOpenResult(result: EnsureAgapeSessionResult): string | null {
  switch (result.action) {
    case 'created':
      return 'Sessão de ágape aberta para lançamentos.'
    case 'reopened':
      return 'Sessão de ágape reaberta.'
    case 'already_open':
      return 'Sessão de ágape já estava aberta.'
    case 'skipped_finalized':
      return 'Ágape deste evento já foi finalizado no módulo Ágape.'
    default:
      return null
  }
}
