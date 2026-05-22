import { supabase } from '@/lib/supabase/client'
import { mapBrotherFromDB } from '@/lib/brother-mappers'
import type {
  Event,
  SessionRecord,
  Attendance,
  Brother,
  Location,
} from '@/lib/data'

const LOCATIONS_STORAGE_KEY = 'chancellor_locations'

export function mapEventFromDB(row: Record<string, unknown>): Event {
  const time = row.time
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    date: String(row.date ?? ''),
    time:
      typeof time === 'string'
        ? time.slice(0, 5)
        : time != null
          ? String(time).slice(0, 5)
          : '00:00',
    type: (row.type as Event['type']) || 'Sessão',
    location: String(row.location ?? ''),
    locationId: row.location_id ? String(row.location_id) : undefined,
    description: String(row.description ?? ''),
    attendees: 0,
    reminders: [],
    timeline: [],
  }
}

export function mapSessionRecordFromDB(
  row: Record<string, unknown>,
): SessionRecord {
  return {
    id: String(row.id),
    eventId: String(row.event_id ?? ''),
    date: String(row.date ?? ''),
    charityCollection: Number(row.charity_collection) || 0,
    observations: String(row.observations ?? ''),
    status: (row.status as SessionRecord['status']) || 'Pendente',
  }
}

export function mapAttendanceFromDB(row: Record<string, unknown>): Attendance {
  return {
    id: String(row.id),
    sessionRecordId: String(row.session_record_id ?? ''),
    brotherId: String(row.brother_id ?? ''),
    status: (row.status as Attendance['status']) || 'Ausente',
    justification: row.justification
      ? String(row.justification)
      : undefined,
  }
}

export function loadLocationsFromStorage(): Location[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCATIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Location[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocationsToStorage(locations: Location[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations))
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  const message = error.message || ''
  return (
    error.code === 'PGRST116' ||
    message.includes('relation') ||
    message.includes('does not exist')
  )
}

export async function fetchChancellorEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data ?? []).map((row) => mapEventFromDB(row))
}

export async function fetchChancellorSessionRecords(): Promise<SessionRecord[]> {
  const { data, error } = await supabase.from('session_records').select('*')

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data ?? []).map((row) => mapSessionRecordFromDB(row))
}

export async function fetchChancellorAttendance(): Promise<Attendance[]> {
  const { data, error } = await supabase.from('attendance').select('*')

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data ?? []).map((row) => mapAttendanceFromDB(row))
}

export async function fetchChancellorBrothers(): Promise<Brother[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('brothers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data ?? []).map((row: Record<string, unknown>) => mapBrotherFromDB(row))
}

export function eventToDbPayload(event: Event) {
  return {
    title: event.title,
    date: event.date,
    time: event.time,
    type: event.type,
    location: event.location,
    location_id: event.locationId ?? null,
    description: event.description || '',
  }
}
