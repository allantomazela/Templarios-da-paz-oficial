import { supabase } from '@/lib/supabase/client'

export interface EventGenerationBatch {
  id: string
  createdAt: string
  createdBy?: string
  createdByName?: string
  sessionsCount: number
  firstDate?: string
  lastDate?: string
  undoneAt?: string
  undoneBy?: string
}

export interface CreateGenerationBatchInput {
  id: string
  createdBy?: string
  sessionsCount: number
  firstDate: string
  lastDate: string
}

function mapBatchFromDB(row: Record<string, unknown>): EventGenerationBatch {
  const profile = row.profiles as Record<string, unknown> | null | undefined
  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? ''),
    createdBy: row.created_by ? String(row.created_by) : undefined,
    createdByName: profile?.full_name ? String(profile.full_name) : undefined,
    sessionsCount: Number(row.sessions_count) || 0,
    firstDate: row.first_date ? String(row.first_date) : undefined,
    lastDate: row.last_date ? String(row.last_date) : undefined,
    undoneAt: row.undone_at ? String(row.undone_at) : undefined,
    undoneBy: row.undone_by ? String(row.undone_by) : undefined,
  }
}

export async function fetchActiveGenerationBatches(): Promise<EventGenerationBatch[]> {
  const { data, error } = await supabase
    .from('event_generation_batches')
    .select('*, profiles:created_by(full_name)')
    .is('undone_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapBatchFromDB(row as Record<string, unknown>))
}

export async function createGenerationBatch(
  input: CreateGenerationBatchInput,
): Promise<EventGenerationBatch> {
  const { data, error } = await supabase
    .from('event_generation_batches')
    .insert({
      id: input.id,
      created_by: input.createdBy ?? null,
      sessions_count: input.sessionsCount,
      first_date: input.firstDate,
      last_date: input.lastDate,
    })
    .select('*, profiles:created_by(full_name)')
    .single()

  if (error) throw error
  return mapBatchFromDB(data as Record<string, unknown>)
}

export async function markGenerationBatchUndone(
  batchId: string,
  undoneBy?: string,
): Promise<void> {
  const { error } = await supabase
    .from('event_generation_batches')
    .update({
      undone_at: new Date().toISOString(),
      undone_by: undoneBy ?? null,
    })
    .eq('id', batchId)
    .is('undone_at', null)

  if (error) throw error
}
