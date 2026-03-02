import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, MapPin, LogIn } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

type Status = 'idle' | 'loading' | 'success' | 'error' | 'login_required'

export default function CheckinPage() {
  const { sessionRecordId } = useParams<{ sessionRecordId: string }>()
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
    if (!sessionRecordId || !session || status !== 'idle' || !sessionChecked) return

    setStatus('loading')
    setMessage('Solicitando localização...')

    const doCheckin = (lat?: number, lng?: number) => {
      const url = `${SUPABASE_URL}/functions/v1/checkin`
      fetch(url, {
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
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setStatus('error')
            setMessage(data.error)
          } else {
            setStatus('success')
            setMessage(data.message || 'Check-in realizado com sucesso.')
          }
        })
        .catch((err) => {
          setStatus('error')
          setMessage(err?.message || 'Erro de conexão. Tente novamente.')
        })
    }

    if (!navigator.geolocation) {
      doCheckin()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMessage('Registrando presença...')
        doCheckin(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setMessage('Localização não permitida. Tentando check-in sem geolocalização...')
        doCheckin()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [sessionRecordId, session, sessionChecked, status])

  if (!sessionRecordId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Use o QR code da sessão para acessar a página de check-in.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Ir para o início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
    const redirect = `/checkin/${sessionRecordId}`
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-6 w-6" />
              Login necessário
            </CardTitle>
            <CardDescription>
              Faça login para registrar sua presença nesta sessão.
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
            {(status === 'loading' || status === 'idle') && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            {(status === 'loading' || status === 'idle') && 'Check-in'}
            {status === 'success' && 'Presença registrada'}
            {status === 'error' && 'Erro no check-in'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {message}</span>}
            {(status === 'success' || status === 'error') && message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(status === 'success' || status === 'error') && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Ir para o início</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
