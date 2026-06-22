import type { Brother } from '@/lib/data'

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
