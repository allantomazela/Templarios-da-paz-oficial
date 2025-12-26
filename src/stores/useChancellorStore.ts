import { create } from 'zustand'
import {
  SessionRecord,
  Attendance,
  Brother,
  Event,
  Solid,
  Location,
  Notification,
  mockSessionRecords,
  mockAttendance,
  mockBrothers,
  mockEvents,
  mockSolids,
  mockLocations,
  mockNotifications,
} from '@/lib/data'
import { devLog } from '@/lib/logger'

interface ChancellorState {
  sessionRecords: SessionRecord[]
  attendanceRecords: Attendance[]
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
  updateBrotherDegree: (brotherId: string, updates: Partial<Brother>) => void

  // Events
  addEvent: (event: Event) => void
  updateEvent: (event: Event) => void
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
}

export const useChancellorStore = create<ChancellorState>((set) => ({
  sessionRecords: mockSessionRecords,
  attendanceRecords: mockAttendance,
  brothers: mockBrothers,
  events: mockEvents,
  solids: mockSolids,
  locations: mockLocations,
  notifications: mockNotifications,
  reviewedAlerts: [],

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

  updateBrotherDegree: (brotherId, updates) =>
    set((state) => ({
      brothers: state.brothers.map((b) =>
        b.id === brotherId ? { ...b, ...updates } : b,
      ),
    })),

  addEvent: (event) => {
    devLog(`useChancellorStore: Adicionando evento - ID: ${event.id}, Título: ${event.title}, Data: ${event.date}`)
    set((state) => {
      const newEvents = [...state.events, event]
      devLog(`useChancellorStore: Total de eventos após adicionar: ${newEvents.length}`)
      return { events: newEvents }
    })
  },
  updateEvent: (event) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === event.id ? event : e)),
    })),
  deleteEvent: (id) =>
    set((state) => ({ events: state.events.filter((e) => e.id !== id) })),

  addSolid: (solid) => set((state) => ({ solids: [...state.solids, solid] })),
  updateSolid: (solid) =>
    set((state) => ({
      solids: state.solids.map((s) => (s.id === solid.id ? solid : s)),
    })),
  deleteSolid: (id) =>
    set((state) => ({ solids: state.solids.filter((s) => s.id !== id) })),

  addLocation: (location) =>
    set((state) => ({ locations: [...state.locations, location] })),
  updateLocation: (location) =>
    set((state) => ({
      locations: state.locations.map((l) =>
        l.id === location.id ? location : l,
      ),
    })),
  deleteLocation: (id) =>
    set((state) => ({
      locations: state.locations.filter((l) => l.id !== id),
    })),

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
}))

export default useChancellorStore
