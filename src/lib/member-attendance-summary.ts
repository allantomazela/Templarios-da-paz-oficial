import { supabase } from '@/lib/supabase/client'

export interface MemberAttendanceSummary {
  hasData: boolean
  percentage: number | null
  presentCount: number
  totalCount: number
}

/** Frequência do irmão com base em registros reais de presença (RLS: próprio brother_id). */
export async function fetchMemberAttendanceSummary(
  userId: string,
): Promise<MemberAttendanceSummary> {
  const { data: rows, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('brother_id', userId)

  if (error) {
    const message = error.message || ''
    if (
      message.includes('relation') ||
      message.includes('does not exist') ||
      error.code === 'PGRST116'
    ) {
      return { hasData: false, percentage: null, presentCount: 0, totalCount: 0 }
    }
    throw error
  }

  const records = rows ?? []
  if (records.length === 0) {
    return { hasData: false, percentage: null, presentCount: 0, totalCount: 0 }
  }

  const presentCount = records.filter(
    (r) => (r.status as string) === 'Presente',
  ).length
  const totalCount = records.length
  const percentage = Math.round((presentCount / totalCount) * 100)

  return {
    hasData: true,
    percentage,
    presentCount,
    totalCount,
  }
}
