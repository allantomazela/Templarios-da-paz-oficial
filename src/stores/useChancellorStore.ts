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
import {
  createGenerationBatch,
  fetchActiveGenerationBatches,
  markGenerationBatchUndone,
  type EventGenerationBatch,
  type CreateGenerationBatchInput,
} from '@/lib/event-generation-batches'
import { devLog, logError } from '@/lib/logger'
import { createRequestSequence } from '@/lib/request-sequence'
import { brotherRowIdFromAttendanceRef } from '@/lib/chancellor-attendance'
import {
  describeAgapeOpenResult,
  ensureAgapeSessionOpenForEvent,
} from '@/lib/chancellor-session-open'
import useAgapeStore from '@/stores/useAgapeStore'

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
  generationBatches: EventGenerationBatch[]
  solids: Solid[]
  locations: Location[]
  notifications: Notification[]
  reviewedAlerts: string[] // List of brotherIds whose alerts have been reviewed

  addSessionRecord: (record: SessionRecord) => void
  updateSessionRecord: (record: SessionRecord) => void
  replaceSessionRecord: (previousId: string, record: SessionRecord) => void
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
  bulkAddEvents: (events: Event[]) => Promise<{ created: Event[]; failed: number }>
  registerGenerationBatch: (
    input: CreateGenerationBatchInput,
  ) => Promise<EventGenerationBatch | null>
  updateEvent: (event: Event) => Promise<boolean>
  deleteEvent: (id: string) => void
  /** Remove todas as sessões de um lote gerado automaticamente (desfazer geração). */
  deleteEventsByBatch: (batchId: string) => Promise<number>

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
  fetchChancellorData: (options?: { force?: boolean }) => Promise<void>
  chancellorDataLoading: boolean
  resetLoadingFlags: () => void

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
  /** Abre sessão (status Pendente) para check-in no app e ágape vinculado. */
  openSessionForEvent: (event: Event) => Promise<{
    sessionRecordId: string
    alreadyOpen: boolean
    agapeMessage: string | null
  }>
}

export const useChancellorStore = create<ChancellorState>((set, get) => ({
  sessionRecords: [],
  attendanceRecords: [],
  visitorAttendances: [],
  brothers: [],
  events: [],
  generationBatches: [],
  solids: [],
  locations: loadLocationsFromStorage(),
  notifications: [],
  reviewedAlerts: [],
  chancellorDataLoading: false,

  resetLoadingFlags: () => {
    set({ chancellorDataLoading: false })
  },

  fetchChancellorData: async (options?: { force?: boolean }) => {
    const state = get()
    if (state.chancellorDataLoading && !options?.force) return
    if (
      !options?.force &&
      state.events.length > 0 &&
      state.brothers.length > 0
    ) {
      return
    }

    set({ chancellorDataLoading: true })
    try {
      const [events, sessionRecords, brothers, generationBatches] =
        await Promise.all([
          fetchChancellorEvents(),
          fetchChancellorSessionRecords(),
          fetchChancellorBrothers(),
          fetchActiveGenerationBatches(),
        ])
      const attendanceRecords = await fetchChancellorAttendance({
        sessionRecordIds: sessionRecords.map((record) => record.id),
      })
      const normalizedAttendance = attendanceRecords.map((record) => ({
        ...record,
        brotherId: brotherRowIdFromAttendanceRef(brothers, record.brotherId),
      }))
      set({
        events,
        generationBatches,
        sessionRecords,
        attendanceRecords: normalizedAttendance,
        brothers,
        locations: loadLocationsFromStorage(),
      })
    } catch (error) {
      if (handleAuthError(error)) return
      logError('fetchChancellorData', error)
      // Mantém snapshot anterior em falha transitória (evita tela vazia / "precisa F5").
      // Só limpa se ainda não houver dados carregados nesta sessão.
      const current = get()
      const hasCachedData =
        current.events.length > 0 || current.brothers.length > 0
      if (!hasCachedData) {
        set({
          events: [],
          generationBatches: [],
          sessionRecords: [],
          attendanceRecords: [],
          brothers: [],
        })
      }
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

  replaceSessionRecord: (previousId, record) =>
    set((state) => ({
      sessionRecords: [
        ...state.sessionRecords.filter(
          (r) => r.id !== previousId && r.id !== record.id,
        ),
        record,
      ],
      attendanceRecords: state.attendanceRecords.map((ar) =>
        ar.sessionRecordId === previousId
          ? { ...ar, sessionRecordId: record.id }
          : ar,
      ),
      visitorAttendances: state.visitorAttendances.map((vr) =>
        vr.sessionRecordId === previousId
          ? { ...vr, sessionRecordId: record.id }
          : vr,
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
      throw error
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
  bulkAddEvents: async (eventsToAdd) => {
    if (eventsToAdd.length === 0) {
      return { created: [], failed: 0 }
    }

    set((state) => ({ events: [...state.events, ...eventsToAdd] }))

    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventsToAdd.map(eventToDbPayload))
        .select('*')

      if (error) throw error

      const persisted = (data ?? []).map((row) => {
        const mapped = mapEventFromDB(row)
        const original = eventsToAdd.find((event) => event.id === mapped.id)
        return { ...mapped, locationId: original?.locationId ?? mapped.locationId }
      })

      const persistedIds = new Set(persisted.map((event) => event.id))
      set((state) => ({
        events: [
          ...state.events.filter((event) => !persistedIds.has(event.id)),
          ...persisted,
        ],
      }))

      return {
        created: persisted,
        failed: eventsToAdd.length - persisted.length,
      }
    } catch (error) {
      if (handleAuthError(error)) {
        return { created: [], failed: eventsToAdd.length }
      }
      logError('bulkAddEvents persist', error)
      const ids = new Set(eventsToAdd.map((event) => event.id))
      set((state) => ({
        events: state.events.filter((event) => !ids.has(event.id)),
      }))
      return { created: [], failed: eventsToAdd.length }
    }
  },
  registerGenerationBatch: async (input) => {
    try {
      const batch = await createGenerationBatch(input)
      set((state) => ({
        generationBatches: [batch, ...state.generationBatches],
      }))
      return batch
    } catch (error) {
      if (handleAuthError(error)) return null
      logError('registerGenerationBatch', error)
      return null
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

  deleteEventsByBatch: async (batchId) => {
    if (!batchId) return 0
    const removed = get().events.filter((e) => e.generatedBatchId === batchId)
    const batch = get().generationBatches.find((item) => item.id === batchId)
    const expectedCount = removed.length || batch?.sessionsCount || 0
    if (expectedCount === 0) return 0

    const undoneBy = useAuthStore.getState().user?.id

    set((state) => ({
      events: state.events.filter((e) => e.generatedBatchId !== batchId),
      generationBatches: state.generationBatches.filter(
        (item) => item.id !== batchId,
      ),
    }))

    try {
      if (removed.length > 0) {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('generated_batch_id', batchId)
        if (error) throw error
      }

      await markGenerationBatchUndone(batchId, undoneBy)
      return removed.length || expectedCount
    } catch (error) {
      if (handleAuthError(error)) return 0
      logError('deleteEventsByBatch persist', error)
      if (batch) {
        set((state) => ({
          events: [...state.events, ...removed],
          generationBatches: [batch, ...state.generationBatches],
        }))
      } else {
        set((state) => ({ events: [...state.events, ...removed] }))
      }
      return 0
    }
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
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('id', event.id)
        .maybeSingle()

      let eventId = existingEvent?.id
      if (!eventId) {
        const { data: eventRow, error: eventErr } = await supabase
          .from('events')
          .insert(eventToDbPayload(event))
          .select('id')
          .single()
        if (eventErr) throw eventErr
        eventId = eventRow.id
      }

      const sessionPayload = {
        event_id: eventId,
        date: sessionRecord.date,
        charity_collection: sessionRecord.charityCollection ?? 0,
        observations: sessionRecord.observations || '',
        status: sessionRecord.status,
        updated_at: new Date().toISOString(),
      }

      const { data: existingById } = await supabase
        .from('session_records')
        .select('id')
        .eq('id', sessionRecord.id)
        .maybeSingle()

      if (existingById) {
        const { error: updateErr } = await supabase
          .from('session_records')
          .update(sessionPayload)
          .eq('id', existingById.id)
        if (updateErr) throw updateErr
        return existingById.id
      }

      const { data: existingByEvent } = await supabase
        .from('session_records')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle()

      if (existingByEvent) {
        const { error: updateErr } = await supabase
          .from('session_records')
          .update(sessionPayload)
          .eq('id', existingByEvent.id)
        if (updateErr) throw updateErr
        return existingByEvent.id
      }

      const { data: recordRow, error: recordErr } = await supabase
        .from('session_records')
        .insert({
          id: sessionRecord.id,
          ...sessionPayload,
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
        brotherId: brotherRowIdFromAttendanceRef(get().brothers, r.brother_id),
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

  openSessionForEvent: async (event) => {
    const existing = get().sessionRecords.find((record) => record.eventId === event.id)

    if (existing?.status === 'Pendente') {
      return {
        sessionRecordId: existing.id,
        alreadyOpen: true,
        agapeMessage: describeAgapeOpenResult(
          await ensureAgapeSessionOpenForEvent(event),
        ),
      }
    }

    if (existing?.status === 'Finalizada') {
      throw new Error(
        'Esta sessão já foi finalizada. Edite o registro se precisar ajustar a presença.',
      )
    }

    const sessionRecord: SessionRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      eventId: event.id,
      date: event.date,
      charityCollection: existing?.charityCollection ?? 0,
      observations: existing?.observations ?? '',
      status: 'Pendente',
    }

    const dbId = await get().ensureSessionRecordInSupabase(event, sessionRecord)
    const finalRecord: SessionRecord = { ...sessionRecord, id: dbId }

    if (existing) {
      get().updateSessionRecord(finalRecord)
    } else {
      get().addSessionRecord(finalRecord)
    }

    const agapeResult = await ensureAgapeSessionOpenForEvent(event)
    await useAgapeStore.getState().fetchSessions()
    await get().fetchChancellorData({ force: true })

    return {
      sessionRecordId: dbId,
      alreadyOpen: false,
      agapeMessage: describeAgapeOpenResult(agapeResult),
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
