/** Janela padrão de histórico da chancelaria (sessões, presença, eventos). */
export const CHANCELLOR_DATA_LOOKBACK_YEARS = 5

export function getChancellorLookbackSinceIso(
  referenceDate: Date = new Date(),
): string {
  const since = new Date(referenceDate)
  since.setFullYear(since.getFullYear() - CHANCELLOR_DATA_LOOKBACK_YEARS)
  return since.toISOString().slice(0, 10)
}

export const SESSION_RECORD_COLUMNS =
  'id, event_id, date, charity_collection, observations, status'

export const ATTENDANCE_COLUMNS =
  'id, session_record_id, brother_id, status, justification'

export const CHANCELLOR_EVENT_COLUMNS =
  'id, title, date, time, type, location, location_id, description, is_auto_generated, generated_batch_id'

/** Limite de IDs por consulta .in() no PostgREST (margem de segurança). */
export const SUPABASE_IN_CHUNK_SIZE = 200

export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize))
  }
  return chunks
}
