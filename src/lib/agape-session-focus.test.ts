import { describe, expect, it } from 'vitest'
import { resolveFocusSessionId } from './agape-session-focus'

function session(
  id: string,
  date: string,
  status: 'open' | 'closed' | 'finalized',
  created_at = `${date}T12:00:00Z`,
) {
  return { id, date, status, created_at }
}

describe('resolveFocusSessionId', () => {
  it('retorna null sem sessões', () => {
    expect(resolveFocusSessionId([])).toBeNull()
  })

  it('aponta a próxima por data, mesmo com outra aberta depois', () => {
    const focus = resolveFocusSessionId([
      session('later-open', '2026-11-28', 'open'),
      session('next', '2026-11-14', 'closed'),
      session('done', '2026-10-01', 'finalized'),
    ])
    expect(focus).toBe('next')
  })

  it('entre pendentes, escolhe a data mais antiga', () => {
    const focus = resolveFocusSessionId([
      session('later', '2026-11-28', 'closed'),
      session('next', '2026-11-14', 'closed'),
    ])
    expect(focus).toBe('next')
  })

  it('ignora finalizadas', () => {
    expect(
      resolveFocusSessionId([
        session('a', '2026-11-01', 'finalized'),
        session('b', '2026-11-08', 'finalized'),
      ]),
    ).toBeNull()
  })
})
