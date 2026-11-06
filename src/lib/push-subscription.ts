import { supabase } from '@/lib/supabase/client'
import { getVapidPublicKey, urlBase64ToUint8Array } from '@/lib/vapid-public'

interface StoredPushRow {
  id: string
  subscription_data: { endpoint?: string } | null
}

function isMockEndpoint(endpoint: string | undefined): boolean {
  if (!endpoint) return true
  return endpoint.includes('mock')
}

/** Inscreve este aparelho e grava só a assinatura real. Não guarda token falso. */
export async function registerDevicePushSubscription(
  profileId: string,
): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        getVapidPublicKey(),
      ) as BufferSource,
    }))

  const json = subscription.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!endpoint || !p256dh || !auth || isMockEndpoint(endpoint)) {
    return false
  }

  const { data: rows, error: listError } = await supabase
    .from('push_subscriptions')
    .select('id, subscription_data')
    .eq('profile_id', profileId)

  if (listError) throw listError

  const staleIds = ((rows ?? []) as StoredPushRow[])
    .filter((row) => {
      const stored = row.subscription_data?.endpoint
      return isMockEndpoint(stored) || stored === endpoint
    })
    .map((row) => row.id)

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', staleIds)
    if (deleteError) throw deleteError
  }

  const { error: insertError } = await supabase.from('push_subscriptions').insert({
    profile_id: profileId,
    subscription_data: {
      endpoint,
      keys: {
        p256dh,
        auth,
      },
    },
  })

  if (insertError) throw insertError
  return true
}
