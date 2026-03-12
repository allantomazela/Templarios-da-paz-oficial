import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, MapPin, LogIn, QrCode } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

type Status = 'idle' | 'loading' | 'success' | 'error' | 'login_required'

interface OpenSessionResult {
  session_record_id: string
  event_id: string
  event_date: string
  event_time: string
}

export default function TempleCheckinPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('')
  const [session, setSession] = useState<{ access_token: string } | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ? { access_token: s.access_token } : null)
      setSessionChecked(true)
      if (!s) setStatus('login_required')
    })
  }, [])

  useEffect(() => {
    if (!session || !sessionChecked || status !== 'idle') return

    setStatus('loading')
    setMessage('Solicitando localização...')

    const doCheckin = async (lat?: number, lng?: number) => {
      try {
        // 1) Descobrir automaticamente qual sessão está aberta para check-in agora
        const { data, error } = await supabase.rpc<OpenSessionResult>(
          'get_open_session_for_checkin',
        )

        if (error) {
          setStatus('error')
          setMessage(
            error.message ||
              'Não foi possível identificar uma sessão aberta para check-in neste momento.',
          )
          return
        }

        if (!data) {
          setStatus('error')
          setMessage('Não há sessão aberta para check-in neste momento.')
          return
        }

        const sessionRecordId = (data as any).session_record_id as string
        if (!sessionRecordId) {
          setStatus('error')
          setMessage('Não há sessão aberta para check-in neste momento.')
          return
        }

        // 2) Enviar para a Edge Function de check-in usando sessionRecordId + geolocalização
        const url = `${SUPABASE_URL}/functions/v1/checkin`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            sessionRecordId,
            latitude: lat,
            longitude: lng,
          }),
        })

        const body = await res.json()
        if (body.error) {
          setStatus('error')
          setMessage(body.error)
        } else {
          setStatus('success')
          setMessage(body.message || 'Check-in realizado com sucesso.')
        }
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Erro de conexão. Tente novamente.')
      }
    }

    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Você precisa estar fisicamente no Templo para assinar a presença.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMessage('Registrando presença...')
        void doCheckin(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setStatus('error')
        setMessage('Você precisa estar fisicamente no Templo para assinar a presença.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [session, sessionChecked, status])

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando login...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'login_required') {
    const redirect = '/checkin-templo'
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-6 w-6" />
              Login necessário
            </CardTitle>
            <CardDescription>
              Faça login para registrar sua presença pelo QR fixo do Templo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>
                Fazer login
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(status === 'loading' || status === 'idle') && (
              <Loader2 className="h-6 w-6 animate-spin" />
            )}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            {(status === 'loading' || status === 'idle') && 'Check-in pelo QR do Templo'}
            {status === 'success' && 'Presença registrada'}
            {status === 'error' && 'Erro no check-in'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {message}
              </span>
            )}
            {(status === 'success' || status === 'error') && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(status === 'success' || status === 'error') && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/">
                <QrCode className="h-4 w-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

