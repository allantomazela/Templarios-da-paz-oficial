import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { isAuthError } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'
import {
  SessionRecord,
  Attendance,
  VisitorAttendance,
  Brother,
  Event,
  Solid,
  Location,
  Notification,
} from '@/lib/data'
import {
  fetchChancellorAttendance,
  fetchChancellorBrothers,
  fetchChancellorEvents,
  fetchChancellorSessionRecords,
  eventToDbPayload,
  loadLocationsFromStorage,
  mapEventFromDB,
  saveLocationsToStorage,
} from '@/lib/chancellor-data'
import { devLog, logError } from '@/lib/logger'
import { createRequestSequence } from '@/lib/request-sequence'

const visitorAttendancesSeqBySession = new Map<
  string,
  ReturnType<typeof createRequestSequence>
>()

function visitorSeqForSession(sessionRecordId: string) {
  let g = visitorAttendancesSeqBySession.get(sessionRecordId)
  if (!g) {
    g = createRequestSequence()
    visitorAttendancesSeqBySession.set(sessionRecordId, g)
  }
  return g
}

const attendanceFetchSeqBySession = new Map<
  string,
  ReturnType<typeof createRequestSequence>
>()

function attendanceSeqForSession(sessionRecordId: string) {
  let g = attendanceFetchSeqBySession.get(sessionRecordId)
  if (!g) {
    g = createRequestSequence()
    attendanceFetchSeqBySession.set(sessionRecordId, g)
  }
  return g
}

function handleAuthError(error: unknown): boolean {
  if (isAuthError(error)) {
    useAuthStore.getState().clearSessionAndRedirectToLogin()
    return true
  }
  return false
}

interface ChancellorState {
  sessionRecords: SessionRecord[]
  attendanceRecords: Attendance[]
  visitorAttendances: VisitorAttendance[]
  brothers: Brother[]
  events: Event[]
  solids: Solid[]
  locations: Location[]
  notifications: Notification[]
  reviewedAlerts: string[] // List of brotherIds whose alerts have been reviewed

  addSessionRecord: (record: SessionRecord) => void
  updateSessionRecord: (record: SessionRecord) => void
  addAttendanceRecord: (record: Attendance) => void
  updateAttendanceRecord: (record: Attendance) => void
  bulkAddAttendance: (records: Attendance[]) => void
  bulkAddVisitorAttendance: (records: VisitorAttendance[]) => void
  fetchVisitorAttendances: (
    sessionRecordId: string,
  ) => Promise<VisitorAttendance[] | null>
  saveVisitorAttendances: (
    sessionRecordId: string,
    visitors: VisitorAttendance[],
  ) => Promise<void>
  updateBrotherDegree: (brotherId: string, updates: Partial<Brother>) => void

  // Events
  addEvent: (event: Event) => Promise<boolean>
  updateEvent: (event: Event) => Promise<boolean>
  deleteEvent: (id: string) => void

  // Solids
  addSolid: (solid: Solid) => void
  updateSolid: (solid: Solid) => void
  deleteSolid: (id: string) => void

  // Locations
  addLocation: (location: Location) => void
  updateLocation: (location: Location) => void
  deleteLocation: (id: string) => void

  // Notifications
  addNotification: (notification: Notification) => void
  markNotificationAsRead: (id: string) => void
  deleteNotification: (id: string) => void

  // Alerts
  markAlertAsReviewed: (brotherId: string) => void

  /** Carrega dados reais do Supabase (sem mocks). */
  fetchChancellorData: () => Promise<void>
  chancellorDataLoading: boolean

  // Integração Supabase: sessão e presença para check-in por QR
  ensureSessionRecordInSupabase: (
    event: Event,
    sessionRecord: SessionRecord,
  ) => Promise<string>
  fetchAttendanceFromSupabase: (
    sessionRecordId: string,
  ) => Promise<
    | {
        brotherId: string
        status: string
        justification: string | null
        name: string
      }[]
    | null
  >
  saveAttendanceToSupabase: (
    sessionRecordId: string,
    rows: { brotherId: string; status: string; justification?: string }[],
  ) => Promise<void>
}

export const useChancellorStore = create<ChancellorState>((set, get) => ({
  sessionRecords: [],
  attendanceRecords: [],
  visitorAttendances: [],
  brothers: [],
  events: [],
  solids: [],
  locations: loadLocationsFromStorage(),
  notifications: [],
  reviewedAlerts: [],
  chancellorDataLoading: false,

  fetchChancellorData: async () => {
    set({ chancellorDataLoading: true })
    try {
      const [events, sessionRecords, attendanceRecords, brothers] =
        await Promise.all([
          fetchChancellorEvents(),
          fetchChancellorSessionRecords(),
          fetchChancellorAttendance(),
          fetchChancellorBrothers(),
        ])
      set({
        events,
        sessionRecords,
        attendanceRecords,
        brothers,
        locations: loadLocationsFromStorage(),
      })
    } catch (error) {
      if (handleAuthError(error)) return
      logError('fetchChancellorData', error)
      set({
        events: [],
        sessionRecords: [],
        attendanceRecords: [],
        brothers: [],
      })
    } finally {
      set({ chancellorDataLoading: false })
    }
  },

  addSessionRecord: (record) =>
    set((state) => ({ sessionRecords: [...state.sessionRecords, record] })),
  updateSessionRecord: (record) =>
    set((state) => ({
      sessionRecords: state.sessionRecords.map((r) =>
        r.id === record.id ? record : r,
      ),
    })),

  addAttendanceRecord: (record) =>
    set((state) => ({
      attendanceRecords: [...state.attendanceRecords, record],
    })),
  updateAttendanceRecord: (record) =>
    set((state) => ({
      attendanceRecords: state.attendanceRecords.map((r) =>
        r.id === record.id ? record : r,
      ),
    })),

  bulkAddAttendance: (records) =>
    set((state) => {
      // Remove existing for same session to avoid dups if re-saving
      const sessionIds = Array.from(
        new Set(records.map((r) => r.sessionRecordId)),
      )
      const filtered = state.attendanceRecords.filter(
        (ar) => !sessionIds.includes(ar.sessionRecordId),
      )
      return {
        attendanceRecords: [...filtered, ...records],
      }
    }),

  bulkAddVisitorAttendance: (records) =>
    set((state) => {
      const sessionIds = Array.from(
        new Set(records.map((r) => r.sessionRecordId)),
      )
      const filtered = state.visitorAttendances.filter(
        (vr) => !sessionIds.includes(vr.sessionRecordId),
      )
      return {
        visitorAttendances: [...filtered, ...records],
      }
    }),

  fetchVisitorAttendances: async (sessionRecordId) => {
    const seq = visitorSeqForSession(sessionRecordId)
    const reqId = seq.next()
    try {
      const { data, error } = await supabase
        .from('visitor_attendances')
        .select('*')
        .eq('session_record_id', sessionRecordId)
        .order('name', { ascending: true })

      if (error) throw error

      const mapped = (data || []).map(mapVisitorAttendanceFromDb)
      if (seq.isCurrent(reqId)) {
        set((state) => ({
          visitorAttendances: [
            ...state.visitorAttendances.filter(
              (visitor) => visitor.sessionRecordId !== sessionRecordId,
            ),
            ...mapped,
          ],
        }))
      }

      if (!seq.isCurrent(reqId)) return null
      return mapped
    } catch (error) {
      if (handleAuthError(error)) return null
      logError('Erro ao buscar visitantes da sessao', error)
      return []
    }
  },

  saveVisitorAttendances: async (sessionRecordId, visitors) => {
    try {
      const payload = visitors.map((visitor) =>
        mapVisitorAttendanceToDb(visitor, sessionRecordId),
      )

      const { error: deleteError } = await supabase
        .from('visitor_attendances')
        .delete()
        .eq('session_record_id', sessionRecordId)

      if (deleteError) throw deleteError

      if (payload.length > 0) {
        const { error: insertError } = await supabase
          .from('visitor_attendances')
          .insert(payload)

        if (insertError) throw insertError
      }

      // Atualizar estado da store após salvar para a UI refletir sem refresh
      await get().fetchVisitorAttendances(sessionRecordId)
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Erro ao salvar visitantes da sessao', error)
    }
  },

  updateBrotherDegree: (brotherId, updates) =>
    set((state) => ({
      brothers: state.brothers.map((b) =>
        b.id === brotherId ? { ...b, ...updates } : b,
      ),
    })),

  addEvent: async (event) => {
    devLog(
      `useChancellorStore: Adicionando evento - ${event.title}, Data: ${event.date}`,
    )
    set((state) => ({ events: [...state.events, event] }))

    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventToDbPayload(event))
        .select('*')
        .single()

      if (error) throw error
      if (!data) throw new Error('Evento não retornado após insert')

      const persisted = mapEventFromDB(data)
      set((state) => ({
        events: state.events.map((e) =>
          e.id === event.id ? { ...persisted, locationId: event.locationId } : e,
        ),
      }))
      return true
    } catch (error) {
      if (handleAuthError(error)) return false
      logError('addEvent persist', error)
      set((state) => ({
        events: state.events.filter((e) => e.id !== event.id),
      }))
      return false
    }
  },
  updateEvent: async (event) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === event.id ? event : e)),
    }))

    try {
      const { error } = await supabase
        .from('events')
        .update(eventToDbPayload(event))
        .eq('id', event.id)
      if (error) throw error
      return true
    } catch (error) {
      if (handleAuthError(error)) return false
      logError('updateEvent persist', error)
      return false
    }
  },
  deleteEvent: (id) => {
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }))

    void (async () => {
      try {
        const { error } = await supabase.from('events').delete().eq('id', id)
        if (error) throw error
      } catch (error) {
        if (handleAuthError(error)) return
        logError('deleteEvent persist', error)
      }
    })()
  },

  addSolid: (solid) => set((state) => ({ solids: [...state.solids, solid] })),
  updateSolid: (solid) =>
    set((state) => ({
      solids: state.solids.map((s) => (s.id === solid.id ? solid : s)),
    })),
  deleteSolid: (id) =>
    set((state) => ({ solids: state.solids.filter((s) => s.id !== id) })),

  addLocation: (location) =>
    set((state) => {
      const locations = [...state.locations, location]
      saveLocationsToStorage(locations)
      return { locations }
    }),
  updateLocation: (location) =>
    set((state) => {
      const locations = state.locations.map((l) =>
        l.id === location.id ? location : l,
      )
      saveLocationsToStorage(locations)
      return { locations }
    }),
  deleteLocation: (id) =>
    set((state) => {
      const locations = state.locations.filter((l) => l.id !== id)
      saveLocationsToStorage(locations)
      return { locations }
    }),

  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  markAlertAsReviewed: (brotherId) =>
    set((state) => ({
      reviewedAlerts: [...state.reviewedAlerts, brotherId],
    })),

  ensureSessionRecordInSupabase: async (event, sessionRecord) => {
    try {
      const { data: existing } = await supabase
        .from('session_records')
        .select('id')
        .eq('id', sessionRecord.id)
        .single()
      if (existing) return existing.id

      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('date', event.date)
        .eq('time', event.time)
        .eq('title', event.title)
        .maybeSingle()
      let eventId = existingEvent?.id
      if (!eventId) {
        const { data: eventRow, error: eventErr } = await supabase
          .from('events')
          .insert({
            title: event.title,
            date: event.date,
            time: event.time,
            type: event.type,
            location: event.location,
            description: event.description || '',
          })
          .select('id')
          .single()
        if (eventErr) throw eventErr
        eventId = eventRow.id
      }

      const { data: recordRow, error: recordErr } = await supabase
        .from('session_records')
        .insert({
          event_id: eventId,
          date: sessionRecord.date,
          observations: sessionRecord.observations || '',
          status: sessionRecord.status,
        })
        .select('id')
        .single()
      if (recordErr) throw recordErr
      return recordRow.id
    } catch (error) {
      if (handleAuthError(error)) throw error
      logError('ensureSessionRecordInSupabase', error)
      throw error
    }
  },

  fetchAttendanceFromSupabase: async (sessionRecordId) => {
    const seq = attendanceSeqForSession(sessionRecordId)
    const reqId = seq.next()
    try {
      const { data: rows, error } = await supabase
        .from('attendance')
        .select('brother_id, status, justification')
        .eq('session_record_id', sessionRecordId)
      if (error) throw error
      if (!rows?.length) {
        return seq.isCurrent(reqId) ? [] : null
      }
      const ids = [...new Set(rows.map((r) => r.brother_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', ids)
      const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name || '']))
      const mapped = rows.map((r) => ({
        brotherId: r.brother_id,
        status: r.status,
        justification: r.justification,
        name: nameMap.get(r.brother_id) || r.brother_id,
      }))
      return seq.isCurrent(reqId) ? mapped : null
    } catch (error) {
      if (handleAuthError(error)) return null
      logError('fetchAttendanceFromSupabase', error)
      return []
    }
  },

  saveAttendanceToSupabase: async (sessionRecordId, rows) => {
    try {
      if (rows.length === 0) return
      const payload = rows.map((row) => ({
        session_record_id: sessionRecordId,
        brother_id: row.brotherId,
        status: row.status,
        justification: row.justification || null,
        source: 'chancellor',
      }))
      const { error } = await supabase
        .from('attendance')
        .upsert(payload, {
          onConflict: 'session_record_id,brother_id',
        })
      if (error) throw error
    } catch (error) {
      if (handleAuthError(error)) return
      logError('saveAttendanceToSupabase', error)
      throw error
    }
  },
}))

export default useChancellorStore

function mapVisitorAttendanceFromDb(row: any): VisitorAttendance {
  return {
    id: row.id,
    sessionRecordId: row.session_record_id,
    name: row.name,
    degree: row.degree,
    lodge: row.lodge,
    lodgeNumber: row.lodge_number,
    obedience: row.obedience,
    masonicNumber: row.masonic_number || undefined,
  }
}

function mapVisitorAttendanceToDb(
  visitor: VisitorAttendance,
  sessionRecordId: string,
) {
  return {
    id: visitor.id,
    session_record_id: sessionRecordId,
    name: visitor.name,
    degree: visitor.degree,
    lodge: visitor.lodge,
    lodge_number: visitor.lodgeNumber,
    obedience: visitor.obedience,
    masonic_number: visitor.masonicNumber || null,
    updated_at: new Date().toISOString(),
  }
}
