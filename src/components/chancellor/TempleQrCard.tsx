import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  QrCode,
  Printer,
  Copy,
  Download,
  Loader2,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import useChancellorStore from '@/stores/useChancellorStore'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'
import { fetchOpenSessionForCheckin } from '@/lib/checkin-session'
import {
  downloadTempleQrPng,
  generateTempleQrDataUrl,
  getEffectiveTempleCheckinUrl,
  openTempleQrPrintWindow,
} from '@/lib/temple-qr-print'

function formatSessionDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function TempleQrCard() {
  const { toast } = useToast()
  const { templeCheckinUrl, siteTitle } = useSiteSettingsStore()
  const { events, sessionRecords, fetchChancellorData, chancellorDataLoading } =
    useChancellorStore()

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const [openSessionLoading, setOpenSessionLoading] = useState(true)
  const [rpcSession, setRpcSession] = useState<{
    event_date: string
    event_time: string
    event_id: string
  } | null>(null)

  const templeUrl = useMemo(
    () => getEffectiveTempleCheckinUrl(templeCheckinUrl),
    [templeCheckinUrl],
  )

  const pendingRecord = useMemo(
    () => sessionRecords.find((r) => r.status === 'Pendente'),
    [sessionRecords],
  )

  const pendingEvent = useMemo(() => {
    if (!pendingRecord) return null
    return events.find((e) => e.id === pendingRecord.eventId) ?? null
  }, [events, pendingRecord])

  const rpcEvent = useMemo(() => {
    if (!rpcSession?.event_id) return null
    return events.find((e) => e.id === rpcSession.event_id) ?? null
  }, [events, rpcSession])

  const activeEvent = pendingEvent || rpcEvent
  const sessionTitle = activeEvent?.title
  const sessionDate = formatSessionDate(
    rpcSession?.event_date || activeEvent?.date || pendingRecord?.date,
  )
  const sessionTime = rpcSession?.event_time || activeEvent?.time || undefined
  const hasOpenSession = Boolean(rpcSession?.event_id || (pendingRecord && activeEvent))

  const loadOpenSession = useCallback(async () => {
    setOpenSessionLoading(true)
    try {
      const { session, error } = await fetchOpenSessionForCheckin()
      if (error) {
        setRpcSession(null)
        return
      }
      if (session) {
        setRpcSession({
          event_date: session.event_date,
          event_time: session.event_time,
          event_id: session.event_id,
        })
      } else {
        setRpcSession(null)
      }
    } finally {
      setOpenSessionLoading(false)
    }
  }, [])

  const loadQr = useCallback(async () => {
    setQrLoading(true)
    setQrError(null)
    try {
      const dataUrl = await generateTempleQrDataUrl(templeUrl, 280)
      setQrDataUrl(dataUrl)
    } catch {
      setQrDataUrl(null)
      setQrError('Não foi possível gerar o QR Code. Tente atualizar a página.')
    } finally {
      setQrLoading(false)
    }
  }, [templeUrl])

  useEffect(() => {
    void loadQr()
    void loadOpenSession()
  }, [loadQr, loadOpenSession])

  const handleRefresh = async () => {
    await Promise.all([fetchChancellorData(), loadOpenSession(), loadQr()])
    toast({ title: 'Dados atualizados' })
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(templeUrl)
      toast({ title: 'Link copiado' })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Não foi possível copiar o link',
      })
    }
  }

  const handlePrint = async () => {
    if (!qrDataUrl) return
    setPrinting(true)
    try {
      const ok = openTempleQrPrintWindow(qrDataUrl, {
        templeUrl,
        lodgeName: siteTitle || 'Templários da Paz',
        sessionTitle,
        sessionDate,
        sessionTime,
        sessionStatus: hasOpenSession ? 'open' : 'none',
      })
      if (!ok) {
        toast({
          variant: 'destructive',
          title: 'Pop-up bloqueado',
          description: 'Permita pop-ups para imprimir o QR Code.',
        })
      }
    } finally {
      setPrinting(false)
    }
  }

  const handleDownload = async () => {
    if (!qrDataUrl) return
    const safeDate = (pendingEvent?.date || 'sessao').replace(/[^\d-]/g, '')
    await downloadTempleQrPng(qrDataUrl, `qr-checkin-templo-${safeDate}.png`)
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" />
              QR fixo do Templo
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Imprima e leve ao Templo para registro de presença dos irmãos. O QR
              é fixo — a sessão aberta na Chancelaria é detectada automaticamente no
              check-in.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={chancellorDataLoading || openSessionLoading || qrLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-[280px] w-[280px] items-center justify-center rounded-lg border-2 border-border bg-white p-3 shadow-inner">
              {qrLoading ? (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              ) : qrError ? (
                <p className="px-4 text-center text-sm text-destructive">{qrError}</p>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code fixo do Templo para check-in de presença"
                  className="h-full w-full object-contain"
                  width={280}
                  height={280}
                />
              ) : null}
            </div>
            <p className="max-w-[280px] text-center text-[11px] text-muted-foreground break-all">
              {templeUrl}
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="text-sm font-medium">Sessão para check-in</p>
              {openSessionLoading || chancellorDataLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando sessão aberta...
                </div>
              ) : hasOpenSession ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      Sessão aberta
                    </Badge>
                    {sessionDate && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {sessionDate}
                        {sessionTime ? ` · ${sessionTime}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-semibold">{sessionTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Estes dados aparecerão na folha de impressão junto ao QR Code.
                  </p>
                </>
              ) : (
                <Alert className="border-amber-300 bg-amber-50 text-amber-950">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-amber-900">Nenhuma sessão aberta</AlertTitle>
                  <AlertDescription className="text-amber-800">
                    Abra o registro de presença em{' '}
                    <strong>Chancelaria → Presença</strong> antes do check-in. O QR
                    ainda pode ser impresso, mas os irmãos só conseguirão registrar
                    presença com sessão pendente.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handlePrint()}
                disabled={!qrDataUrl || printing}
                className="min-w-[140px]"
              >
                {printing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Imprimir QR
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDownload()}
                disabled={!qrDataUrl}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar PNG
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleCopyLink()}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Para alterar o endereço do QR (outro domínio ou Loja), use{' '}
              <strong>Configurações → Check-in por QR Code</strong>.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
