export function getEnvConfigError(): string | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const key = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  )?.trim()

  if (!url) {
    return 'A variável VITE_SUPABASE_URL não está configurada.'
  }

  if (!key) {
    return 'A variável VITE_SUPABASE_PUBLISHABLE_KEY não está configurada.'
  }

  return null
}
