import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  Wifi,
} from 'lucide-react'
import {
  IT_FIREWALL_CHECKLIST,
  runConnectivityChecks,
  summarizeConnectivity,
  type ConnectivityProbeResult,
} from '@/lib/connectivity-check'
import { cn } from '@/lib/utils'

export default function ConnectivityCheck() {
  const [results, setResults] = useState<ConnectivityProbeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const summary = hasRun ? summarizeConnectivity(results) : null

  const handleRun = async () => {
    setLoading(true)
    try {
      const probes = await runConnectivityChecks()
      setResults(probes)
      setHasRun(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Diagnóstico de conectividade
          </h1>
          <p className="text-sm text-muted-foreground">
            Use esta página em redes corporativas ou quando o site não carregar
            completamente. O teste verifica acesso ao site e ao Supabase (login
            e dados).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wifi className="h-5 w-5" />
              Teste de acesso
            </CardTitle>
            <CardDescription>
              Produção usa apenas HTTPS na porta 443 — não é necessário liberar
              8080 ou 5173.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              onClick={() => void handleRun()}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Testando...' : 'Executar diagnóstico'}
            </Button>

            {summary ? (
              <div
                className={cn(
                  'rounded-md border p-4',
                  summary.allRequiredOk
                    ? 'border-green-200 bg-green-50 text-green-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900',
                )}
              >
                <div className="flex items-start gap-2">
                  {summary.allRequiredOk ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      {summary.allRequiredOk
                        ? 'Conectividade OK para uso do sistema'
                        : 'Bloqueio detectado em serviço essencial'}
                    </p>
                    <p className="mt-1 text-sm opacity-90">
                      {summary.allRequiredOk
                        ? 'Se ainda houver problemas, limpe o cache ou teste em aba anônima.'
                        : 'Encaminhe a checklist abaixo ao TI da rede. O bloqueio mais comum é em *.supabase.co.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((item) => (
                  <ProbeRow key={item.id} probe={item} />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Checklist para TI / firewall
            </CardTitle>
            <CardDescription>
              Itens para solicitar liberação na rede corporativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {IT_FIREWALL_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}

function ProbeRow({ probe }: { probe: ConnectivityProbeResult }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">{probe.label}</span>
          <Badge variant={probe.ok ? 'default' : 'destructive'}>
            {probe.ok ? 'OK' : 'Falhou'}
          </Badge>
          {probe.required ? (
            <Badge variant="outline" className="text-xs">
              Obrigatório
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{probe.url}</p>
        {probe.error ? (
          <p className="text-xs text-destructive">{probe.error}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-xs text-muted-foreground">
        {probe.status !== undefined ? `HTTP ${probe.status}` : '—'}
        {probe.latencyMs !== undefined ? ` · ${probe.latencyMs} ms` : ''}
      </div>
    </div>
  )
}
