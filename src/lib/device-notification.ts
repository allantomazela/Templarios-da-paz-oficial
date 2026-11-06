/** Alerta do sistema só se o irmão já autorizou. Não pede permissão de novo. */
export async function showDeviceNotification(
  title: string,
  body: string,
  tag: string,
): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const text = body.replace(/\s+/g, ' ').trim().slice(0, 180)
  const options: NotificationOptions = {
    body: text,
    icon: '/icon-192.png',
    tag,
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(title, options)
        return
      }
    }
  } catch {
    // O sino do aplicativo continua sendo a via principal.
  }

  try {
    new Notification(title, options)
  } catch {
    // Navegador sem alerta de sistema. O aviso permanece no sino.
  }
}
