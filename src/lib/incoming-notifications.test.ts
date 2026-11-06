import { describe, expect, it } from 'vitest'
import { selectFreshNotifications } from './incoming-notifications'

const item = (id: string, isRead = false) => ({
  id,
  is_read: isRead,
  title: 'Aviso',
  message: 'Texto',
})

describe('selectFreshNotifications', () => {
  it('ignora avisos já conhecidos e os já lidos', () => {
    const fresh = selectFreshNotifications(new Set(['a']), [
      item('a'),
      item('b', true),
      item('c'),
    ])

    expect(fresh.map((entry) => entry.id)).toEqual(['c'])
  })
})
