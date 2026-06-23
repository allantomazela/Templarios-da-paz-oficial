import type { Attendance, Brother, SessionRecord } from '@/lib/data'

/** attendance.brother_id referencia profiles.id — converte id da linha brothers. */
export function profileIdForAttendanceDb(
  brothers: Brother[],
  brotherRowId: string,
): string | null {
  const brother = brothers.find((b) => b.id === brotherRowId)
  if (!brother?.profileId?.trim()) return null
  return brother.profileId
}

/** Normaliza brother_id vindo do banco (profile) para id da tabela brothers (UI). */
export function brotherRowIdFromAttendanceRef(
  brothers: Brother[],
  attendanceBrotherRef: string,
): string {
  const byBrother = brothers.find((b) => b.id === attendanceBrotherRef)
  if (byBrother) return byBrother.id

  const byProfile = brothers.find((b) => b.profileId === attendanceBrotherRef)
  if (byProfile) return byProfile.id

  return attendanceBrotherRef
}

export function brothersWithoutProfileForAttendance(
  brothers: Brother[],
  brotherRowIds: string[],
): Brother[] {
  const ids = new Set(brotherRowIds)
  return brothers.filter((b) => ids.has(b.id) && !b.profileId?.trim())
}

/** Somente presença física conta para frequência; justificativa é falta. */
export function isAttendancePresent(status: string): boolean {
  return status === 'Presente'
}

/** Ausência que deve gerar alerta na Visão Geral da Chancelaria. */
export function isUnjustifiedAbsenceForAlert(
  record: Pick<Attendance, 'status' | 'justification'> | undefined,
): boolean {
  if (!record) return true
  if (record.status === 'Presente' || record.status === 'Justificado') {
    return false
  }
  if (record.status === 'Ausente' && record.justification?.trim()) {
    return false
  }
  return true
}

export function countUnjustifiedAbsencesForSessions(
  brother: Brother,
  sessionIds: string[],
  attendanceRecords: Attendance[],
): number {
  let count = 0
  for (const sessionId of sessionIds) {
    const record = findBrotherAttendanceForSession(
      brother,
      sessionId,
      attendanceRecords,
    )
    if (isUnjustifiedAbsenceForAlert(record)) {
      count++
    }
  }
  return count
}

export function attendanceBelongsToBrother(
  brother: Brother,
  attendanceBrotherRef: string,
): boolean {
  if (attendanceBrotherRef === brother.id) return true
  const profileId = brother.profileId?.trim()
  return Boolean(profileId && attendanceBrotherRef === profileId)
}

export function findBrotherAttendanceForSession(
  brother: Brother,
  sessionRecordId: string,
  attendanceRecords: Attendance[],
): Attendance | undefined {
  return attendanceRecords.find(
    (ar) =>
      ar.sessionRecordId === sessionRecordId &&
      attendanceBelongsToBrother(brother, ar.brotherId),
  )
}

export function getFinalizedSessionIds(
  sessionRecords: SessionRecord[],
): Set<string> {
  return new Set(
    sessionRecords.filter((s) => s.status === 'Finalizada').map((s) => s.id),
  )
}

export function countBrotherPresences(
  brother: Brother,
  attendanceRecords: Attendance[],
  finalizedSessionIds: Set<string>,
): number {
  return attendanceRecords.filter(
    (ar) =>
      finalizedSessionIds.has(ar.sessionRecordId) &&
      attendanceBelongsToBrother(brother, ar.brotherId) &&
      isAttendancePresent(ar.status),
  ).length
}

export function computeBrotherAttendancePercentage(
  brother: Brother,
  attendanceRecords: Attendance[],
  sessionRecords: SessionRecord[],
): { presences: number; percentage: number; totalSessions: number } {
  const finalizedSessionIds = getFinalizedSessionIds(sessionRecords)
  const totalSessions = finalizedSessionIds.size

  if (totalSessions === 0) {
    return { presences: 0, percentage: 0, totalSessions: 0 }
  }

  const presences = countBrotherPresences(
    brother,
    attendanceRecords,
    finalizedSessionIds,
  )
  const percentage = Math.round((presences / totalSessions) * 100)

  return { presences, percentage, totalSessions }
}

/** Conta presenças em uma sessão (apenas status Presente). */
export function countSessionPresentAttendances(
  sessionRecordId: string,
  attendanceRecords: Attendance[],
): number {
  return attendanceRecords.filter(
    (ar) =>
      ar.sessionRecordId === sessionRecordId && isAttendancePresent(ar.status),
  ).length
}
