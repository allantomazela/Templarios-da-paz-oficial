export interface ConnectivityProbeResult {
  id: string
  label: string
  url: string
  ok: boolean
  required: boolean
  status?: number
  latencyMs?: number
  error?: string
}

const PROBE_TIMEOUT_MS = 12_000

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const key = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  )?.trim()
  if (!url || !key) return null
  return { url: url.replace(/\/$/, ''), key }
}

async function probeRequest(
  id: string,
  label: string,
  url: string,
  init: RequestInit,
  required: boolean,
): Promise<ConnectivityProbeResult> {
  const started = performance.now()
  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })
    const latencyMs = Math.round(performance.now() - started)
    const ok = response.ok || response.status === 401 || response.status === 404

    return {
      id,
      label,
      url,
      ok,
      required,
      status: response.status,
      latencyMs,
      error: ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      id,
      label,
      url,
      ok: false,
      required,
      latencyMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : 'Falha na conexão',
    }
  }
}

export async function runConnectivityChecks(): Promise<ConnectivityProbeResult[]> {
  const origin = window.location.origin
  const supabase = getSupabaseConfig()

  const probes: Promise<ConnectivityProbeResult>[] = [
    probeRequest(
      'site',
      'Site principal',
      `${origin}/favicon.png`,
      { method: 'GET', cache: 'no-store' },
      true,
    ),
  ]

  if (supabase) {
    probes.push(
      probeRequest(
        'supabase-auth',
        'Supabase (autenticação)',
        `${supabase.url}/auth/v1/health`,
        { method: 'GET', headers: { apikey: supabase.key } },
        true,
      ),
      probeRequest(
        'supabase-api',
        'Supabase (API / dados)',
        `${supabase.url}/rest/v1/`,
        {
          method: 'HEAD',
          headers: {
            apikey: supabase.key,
            Authorization: `Bearer ${supabase.key}`,
          },
        },
        true,
      ),
    )
  } else {
    probes.push(
      Promise.resolve({
        id: 'supabase-config',
        label: 'Supabase (configuração)',
        url: '(variáveis de ambiente)',
        ok: false,
        required: true,
        error: 'VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY ausentes no build.',
      }),
    )
  }

  return Promise.all(probes)
}

export function summarizeConnectivity(results: ConnectivityProbeResult[]): {
  allRequiredOk: boolean
  failedRequired: ConnectivityProbeResult[]
} {
  const failedRequired = results.filter((item) => item.required && !item.ok)
  return {
    allRequiredOk: failedRequired.length === 0,
    failedRequired,
  }
}

export const IT_FIREWALL_CHECKLIST = [
  'Liberar HTTPS (porta 443) para templariosdapazoficial.com.br e www.templariosdapazoficial.com.br',
  'Liberar HTTPS (porta 443) para *.supabase.co (API, login e armazenamento)',
  'Permitir tráfego REST/HTTPS — não é necessário abrir portas customizadas (8080, 5173, etc.)',
  'Se houver inspeção SSL (proxy corporativo), incluir templariosdapazoficial.com.br e supabase.co nas exceções ou cadeia confiável',
  'Categorias de firewall: permitir SaaS/API cloud para supabase.co',
  'WebSocket não é obrigatório para o funcionamento básico do sistema',
]
