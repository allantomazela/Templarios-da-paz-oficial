import type { AgapeSession } from '@/stores/useAgapeStore'

/**
 * Sessão em foco para lançar consumo:
 * 1) se houver aberta, a mais recente;
 * 2) senão, a próxima não finalizada (data mais antiga pendente).
 */
export function resolveFocusSessionId(
  sessions: ReadonlyArray<Pick<AgapeSession, 'id' | 'date' | 'status' | 'created_at'>>,
): string | null {
  if (sessions.length === 0) return null

  const open = sessions
    .filter((session) => session.status === 'open')
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date)
      if (byDate !== 0) return byDate
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    })

  if (open[0]) return open[0].id

  const pending = sessions
    .filter((session) => session.status !== 'finalized')
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date)
      if (byDate !== 0) return byDate
      return (a.created_at ?? '').localeCompare(b.created_at ?? '')
    })

  return pending[0]?.id ?? null
}
