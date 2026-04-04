/**
 * E-mail do administrador máximo (deve coincidir com a política no Postgres, ex.: is_admin()).
 * Opcional: defina VITE_MASTER_ADMIN_EMAIL no .env para não depender apenas do fallback.
 */
export const MASTER_ADMIN_EMAIL =
  (import.meta.env.VITE_MASTER_ADMIN_EMAIL as string | undefined)?.trim() ||
  'allantomazela@gmail.com'

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  return !!email && email === MASTER_ADMIN_EMAIL
}
