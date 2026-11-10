import type { AgapeSession } from '@/stores/useAgapeStore'

/**
 * Sessão em foco = próxima na ordem do calendário (não finalizada).
 * Ex.: com 14/11 e 28/11 pendentes, o destaque fica em 14/11; ao finalizar, passa para 28/11.
 */
export function resolveFocusSessionId(
  sessions: ReadonlyArray<Pick<AgapeSession, 'id' | 'date' | 'status' | 'created_at'>>,
): string | null {
  if (sessions.length === 0) return null

  const pending = sessions
    .filter((session) => session.status !== 'finalized')
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date)
      if (byDate !== 0) return byDate
      return (a.created_at ?? '').localeCompare(b.created_at ?? '')
    })

  return pending[0]?.id ?? null
}
