/**
 * Chave pública VAPID. A chave privada fica só nos segredos do Supabase.
 * VITE_VAPID_PUBLIC_KEY substitui esta, se estiver definida no build.
 */
const BUILT_IN_VAPID_PUBLIC_KEY =
  'BE_OSlIcPrcbdovljRMXkEvTNAovrd2VVKkSUx1frhUv8oL5RalrtQh_pjmL7239PzRoeCrWj4qLLXwAgpQjKNI'

export function getVapidPublicKey(): string {
  const fromEnv = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim()
  return fromEnv || BUILT_IN_VAPID_PUBLIC_KEY
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (padded.length % 4)) % 4)
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}
