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
import { Loader2, MapPin, Camera, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  createResponsiveQrScanConfig,
  startHtml5QrcodeRearCamera,
  toFriendlyCameraError,
} from '@/lib/qr-scanner-camera'

const GEO_ERROR_MESSAGE =
  'Você precisa estar fisicamente no Templo para assinar a presença.'
const SCANNER_DIV_ID = 'qr-checkin-scanner'

interface QRCheckinScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function QRCheckinScanner({
  open,
  onOpenChange,
  onSuccess,
}: QRCheckinScannerProps) {
  const [step, setStep] = useState<'gps' | 'camera' | 'scanning' | 'success' | 'error'>('gps')
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const { toast } = useToast()

  const reset = useCallback(() => {
    setStep('gps')
    setGpsCoords(null)
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
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
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

  useEffect(() => {
    if (step !== 'scanning' || !open || !gpsCoords) return
    let cancelled = false
    const run = async () => {
      await new Promise((r) => setTimeout(r, 150))
      if (cancelled) return
      try {
        const el = document.getElementById(SCANNER_DIV_ID)
        if (!el) {
          if (!cancelled) {
            setStep('error')
            setMessage(
              'Não foi possível preparar a câmera. Feche o diálogo e tente de novo.',
            )
          }
          return
        }
        if (el.clientWidth < 50) {
          await new Promise<void>((r) => requestAnimationFrame(() => r()))
        }
        if (cancelled) return
        const scanner = new Html5Qrcode(SCANNER_DIV_ID)
        scannerRef.current = scanner
        await startHtml5QrcodeRearCamera(
          scanner,
          createResponsiveQrScanConfig(10),
          async (decodedText) => {
            if (!gpsCoords || !scanner) return
            try {
              if (scanner.isScanning) {
                await scanner.stop()
                scanner.clear()
              }
              scannerRef.current = null
              setMessage('Registrando presença...')
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
              const { data: { session } } = await supabase.auth.getSession()
              if (!session?.access_token) {
                setStep('error')
                setMessage('Faça login para registrar presença.')
                return
              }
              const token = decodedText.trim()
              const res = await fetch(`${supabaseUrl}/functions/v1/checkin`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  token,
                  latitude: gpsCoords.lat,
                  longitude: gpsCoords.lng,
                }),
              })
              const data = await res.json()
              if (data.error) {
                setStep('error')
                setMessage(data.error)
                toast({
                  variant: 'destructive',
                  title: 'Erro no check-in',
                  description: data.error,
                })
                return
              }
              setStep('success')
              setMessage(data.message || 'Presença registrada com sucesso.')
              toast({
                title: 'Presença registrada',
                description: data.message,
              })
              onSuccess?.()
            } catch (err) {
              setStep('error')
              const msg = err instanceof Error ? err.message : 'Erro ao registrar presença.'
              setMessage(msg)
              toast({
                variant: 'destructive',
                title: 'Erro',
                description: msg,
              })
            }
          },
          () => {},
        )
      } catch (err) {
        if (!cancelled) {
          setStep('error')
          setMessage(toFriendlyCameraError(err))
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
  }, [step, open, gpsCoords, onSuccess, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Check-in por QR Code</DialogTitle>
          <DialogDescription>
            Permita a localização e escaneie o QR Code exibido no Templo para assinar a presença.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'gps' && (
            <>
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  O check-in só é permitido dentro do Templo (raio de 50 m). É necessário ativar o GPS e permitir o acesso à localização.
                </AlertDescription>
              </Alert>
              <Button
                className="w-full"
                onClick={requestLocation}
                disabled={loading}
              >
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
            <>
              <p className="text-sm text-muted-foreground">
                Localização obtida. Abra a câmera e escaneie o QR Code da sessão.
              </p>
              <Button className="w-full" onClick={startCamera}>
                <Camera className="mr-2 h-4 w-4" />
                Abrir câmera e escanear
              </Button>
            </>
          )}

          {step === 'scanning' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{message}</p>
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
                  <Button variant="outline" onClick={() => setStep('gps')}>
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
