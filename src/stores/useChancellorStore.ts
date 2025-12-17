import { create } from 'zustand'
import {
  SessionRecord,
  Attendance,
  Brother,
  mockSessionRecords,
  mockAttendance,
  mockBrothers,
} from '@/lib/data'

interface ChancellorState {
  sessionRecords: SessionRecord[]
  attendanceRecords: Attendance[]
  brothers: Brother[] // We keep a local reference to brothers for degree updates

  addSessionRecord: (record: SessionRecord) => void
  updateSessionRecord: (record: SessionRecord) => void
  addAttendanceRecord: (record: Attendance) => void
  updateAttendanceRecord: (record: Attendance) => void
  bulkAddAttendance: (records: Attendance[]) => void
  updateBrotherDegree: (brotherId: string, updates: Partial<Brother>) => void
}

export const useChancellorStore = create<ChancellorState>((set) => ({
  sessionRecords: mockSessionRecords,
  attendanceRecords: mockAttendance,
  brothers: mockBrothers,

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
}))

export default useChancellorStore
