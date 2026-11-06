export interface IncomingNotification {
  id: string
  is_read: boolean
  title: string
  message: string
}

/** Avisos ainda não vistos nesta sessão e ainda não lidos. */
export function selectFreshNotifications<T extends IncomingNotification>(
  previousIds: ReadonlySet<string>,
  next: T[],
): T[] {
  return next.filter((item) => !item.is_read && !previousIds.has(item.id))
}
