import { supabase } from '@/lib/supabase/client'

export interface DashboardEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  type?: string
}

/** Próximos eventos reais (tabela events). Retorna vazio se sem permissão ou sem dados. */
export async function fetchUpcomingDashboardEvents(
  limit = 20,
): Promise<DashboardEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, date, time, location, type')
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .limit(limit)

  if (error) {
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    date: row.date,
    time: typeof row.time === 'string' ? row.time.slice(0, 5) : String(row.time),
    location: row.location,
    type: row.type ?? undefined,
  }))
}
