'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, MapPin, Camera, CheckCircle2, XCircle, QrCode, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import useAuthStore from '@/stores/useAuthStore'

const GEO_ERROR_MESSAGE =
  'Você precisa estar fisicamente no Templo para assinar a presença.'
const SCANNER_DIV_ID = 'checkin-presence-scanner'

interface BrotherInfo {
  fullName: string
  degree: string
  photoUrl: string | null
}

interface CheckinPresenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CheckinPresenceModal({
  open,
  onOpenChange,
  onSuccess,
}: CheckinPresenceModalProps) {
  const { user } = useAuthStore()
  const [step, setStep] = useState<'identity' | 'gps' | 'camera' | 'scanning' | 'confirm' | 'success' | 'error'>('identity')
  const [brotherInfo, setBrotherInfo] = useState<BrotherInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [scannedToken, setScannedToken] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const { toast } = useToast()

  const fullName = brotherInfo?.fullName ?? user?.profile?.full_name ?? user?.user_metadata?.name ?? 'Irmão'
  const degree = brotherInfo?.degree ?? user?.profile?.masonic_degree ?? '—'
  const photoUrl = brotherInfo?.photoUrl ?? user?.profile?.avatar_url ?? null

  const reset = useCallback(() => {
    setStep('identity')
    setGpsCoords(null)
    setScannedToken(null)
    setMessage('')
    setLoading(false)
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current.clear()
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {})
        scanner.clear()
      }
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open || !user?.id) return
    setLoadingInfo(true)
    const loadBrotherInfo = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
        const { data: brother } = await supabase
          .from('brothers')
          .select('name, degree, photo_url')
          .eq('email', user.email ?? '')
          .maybeSingle()
        setBrotherInfo({
          fullName: brother?.name ?? profile?.full_name ?? user?.user_metadata?.name ?? 'Irmão',
          degree: brother?.degree ?? user?.profile?.masonic_degree ?? '—',
          photoUrl: brother?.photo_url ?? profile?.avatar_url ?? null,
        })
      } catch {
        setBrotherInfo({
          fullName: user?.profile?.full_name ?? user?.user_metadata?.name ?? 'Irmão',
          degree: user?.profile?.masonic_degree ?? '—',
          photoUrl: user?.profile?.avatar_url ?? null,
        })
      } finally {
        setLoadingInfo(false)
      }
    }
    loadBrotherInfo()
  }, [open, user?.id, user?.email, user?.profile?.full_name, user?.profile?.avatar_url, user?.profile?.masonic_degree, user?.user_metadata?.name])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStep('error')
      setMessage(GEO_ERROR_MESSAGE)
      return
    }
    setLoading(true)
    setMessage('Solicitando permissão de localização...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStep('camera')
        setMessage('')
        setLoading(false)
      },
      () => {
        setStep('error')
        setMessage(GEO_ERROR_MESSAGE)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  const startCamera = useCallback(() => {
    setStep('scanning')
    setMessage('Aponte a câmera para o QR Code da sessão.')
  }, [])

  const submitPresence = useCallback(async () => {
    if (!scannedToken || !gpsCoords) return
    setLoading(true)
    setMessage('Registrando presença...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setStep('error')
        setMessage('Faça login para registrar presença.')
        return
      }
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${supabaseUrl}/functions/v1/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token: scannedToken,
          latitude: gpsCoords.lat,
          longitude: gpsCoords.lng,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setStep('error')
        setMessage(data.error)
        toast({ variant: 'destructive', title: 'Erro no check-in', description: data.error })
        return
      }
      setStep('success')
      setMessage(data.message || 'Presença registrada com sucesso.')
      toast({ title: 'Presença registrada', description: data.message })
      onSuccess?.()
    } catch (err) {
      setStep('error')
      const msg = err instanceof Error ? err.message : 'Erro ao registrar presença.'
      setMessage(msg)
      toast({ variant: 'destructive', title: 'Erro', description: msg })
    } finally {
      setLoading(false)
    }
  }, [scannedToken, gpsCoords, onSuccess, toast])

  useEffect(() => {
    if (step !== 'scanning' || !open || !gpsCoords) return
    let scanner: Html5Qrcode | null = null
    let cancelled = false
    const run = async () => {
      // Garantir que o div do scanner já está no DOM e visível antes de iniciar a câmera
      await new Promise((r) => setTimeout(r, 100))
      if (cancelled) return
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (!cameras?.length) {
          setStep('error')
          setMessage('Nenhuma câmera encontrada.')
          return
        }
        const el = document.getElementById(SCANNER_DIV_ID)
        if (!el || cancelled) return
        scanner = new Html5Qrcode(SCANNER_DIV_ID)
        scannerRef.current = scanner
        await scanner.start(
          cameras[0].id,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!scanner) return
            if (scanner.isScanning) {
              scanner.stop().then(() => {
                scanner.clear()
                scannerRef.current = null
                setScannedToken(decodedText.trim())
                setStep('confirm')
              }).catch(() => {
                scannerRef.current = null
                setScannedToken(decodedText.trim())
                setStep('confirm')
              })
            } else {
              setScannedToken(decodedText.trim())
              setStep('confirm')
            }
          },
          () => {},
        )
      } catch (err) {
        if (!cancelled) {
          setStep('error')
          setMessage(err instanceof Error ? err.message : 'Não foi possível acessar a câmera.')
        }
      }
    }
    run()
    return () => {
      cancelled = true
      const scanner = scannerRef.current
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {})
        scanner.clear()
      }
      scannerRef.current = null
    }
  }, [step, open, gpsCoords])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={step === 'scanning' ? 'sm:max-w-lg' : 'sm:max-w-md'}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Registrar presença</DialogTitle>
          <DialogDescription>
            Confirme sua identidade e escaneie o QR Code exibido no Templo (dentro de 50 m).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(step === 'identity' || step === 'confirm') && (
            <>
              <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/30 p-4">
                {loadingInfo ? (
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={photoUrl ?? undefined} alt={fullName} />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center space-y-1">
                      <p className="font-semibold text-lg">{fullName}</p>
                      <p className="text-sm text-muted-foreground">Grau: {degree}</p>
                    </div>
                  </>
                )}
              </div>
              {step === 'identity' && (
                <>
                  <Alert>
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>
                      O check-in só é permitido dentro do Templo (raio de 50 m). Será necessário ativar o GPS e escanear o QR Code da sessão.
                    </AlertDescription>
                  </Alert>
                  <Button
                    className="w-full"
                    onClick={() => setStep('gps')}
                    disabled={loadingInfo}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Escanear QR Code para confirmar presença
                  </Button>
                </>
              )}
              {step === 'confirm' && (
                <Button
                  className="w-full"
                  onClick={submitPresence}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar presença
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {step === 'gps' && (
            <>
              <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={photoUrl ?? undefined} alt={fullName} />
                  <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                </Avatar>
                <p className="font-medium">{fullName}</p>
                <p className="text-xs text-muted-foreground">Grau: {degree}</p>
              </div>
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  O check-in só é permitido dentro do Templo (raio de 50 m). É necessário ativar o GPS.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={requestLocation} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Obtendo localização...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Permitir localização e continuar
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'camera' && (
            <Button className="w-full" onClick={startCamera}>
              <Camera className="mr-2 h-4 w-4" />
              Abrir câmera e escanear
            </Button>
          )}

          {step === 'scanning' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {message || 'Aponte a câmera para o QR Code da sessão.'}
              </p>
              <div
                id={SCANNER_DIV_ID}
                className="rounded-lg overflow-hidden bg-black w-full min-h-[280px] aspect-[4/3] max-h-[50vh]"
                style={{ minHeight: 280 }}
              />
            </div>
          )}

          {(step === 'success' || step === 'error') && (
            <div className="space-y-4">
              <Alert variant={step === 'success' ? 'default' : 'destructive'}>
                {step === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                {step === 'error' && (
                  <Button variant="outline" onClick={() => setStep('identity')}>
                    Tentar novamente
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={() => {
                    reset()
                    onOpenChange(false)
                  }}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
