/** Origens permitidas para Edge Functions (alinhado ao app e ao check-in). */
export const ALLOWED_ORIGINS = [
  'https://templariosdapazoficial.com.br',
  'https://www.templariosdapazoficial.com.br',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
] as const

export function corsHeaders(
  origin: string | null,
  methods: string,
): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number])
      ? origin
      : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Max-Age': '86400',
  }
}
