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

  it('prioriza a sessão aberta mais recente', () => {
    const focus = resolveFocusSessionId([
      session('old-open', '2026-10-01', 'open'),
      session('new-open', '2026-11-10', 'open'),
      session('future', '2026-11-20', 'closed'),
    ])
    expect(focus).toBe('new-open')
  })

  it('sem aberta, aponta a próxima não finalizada por data', () => {
    const focus = resolveFocusSessionId([
      session('done', '2026-10-01', 'finalized'),
      session('next', '2026-11-14', 'closed'),
      session('later', '2026-11-28', 'closed'),
    ])
    expect(focus).toBe('next')
  })

  it('ignora finalizadas quando não há aberta', () => {
    expect(
      resolveFocusSessionId([
        session('a', '2026-11-01', 'finalized'),
        session('b', '2026-11-08', 'finalized'),
      ]),
    ).toBeNull()
  })
})
