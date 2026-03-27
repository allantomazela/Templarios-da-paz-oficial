import {
  Html5Qrcode,
  type Html5QrcodeCameraScanConfig,
  type QrcodeErrorCallback,
  type QrcodeSuccessCallback,
} from 'html5-qrcode'

/** Preferir câmera traseira (ambiente) no mobile. */
const REAR_CAMERA_HINTS =
  /back|rear|traseira|environment|wide|ultra|tele|world|principal|0\s*$/i
const FRONT_CAMERA_HINTS = /front|user|selfie|facial|face|1\s*$/i

/**
 * Html5Qrcode só aceita `facingMode` como string ou como `{ exact: 'environment' | 'user' }`.
 * Passar `{ ideal: 'environment' }` (MediaTrackConstraints padrão) faz a lib lançar erro
 * antes de chamar getUserMedia — comum quebrar totalmente no mobile.
 */
const REAR_FACING_HTML5QRCODE = { facingMode: 'environment' as const }
const FRONT_FACING_HTML5QRCODE = { facingMode: 'user' as const }

export function pickRearCameraDeviceId(
  cameras: Array<{ id: string; label: string }>,
): string {
  if (cameras.length === 0) {
    throw new Error('Nenhuma câmera disponível')
  }
  const scored = cameras.map((c) => {
    const label = (c.label || '').toLowerCase()
    const looksRear = REAR_CAMERA_HINTS.test(label)
    const looksFront = FRONT_CAMERA_HINTS.test(label)
    return { id: c.id, looksRear, looksFront }
  })

  const rearOnly = scored.find((c) => c.looksRear && !c.looksFront)
  if (rearOnly) return rearOnly.id

  const rearLoose = scored.find((c) => c.looksRear)
  if (rearLoose) return rearLoose.id

  if (cameras.length > 1) {
    return cameras[cameras.length - 1].id
  }

  return cameras[0].id
}

/** Caixa de leitura proporcional ao viewfinder (evita qrbox maior que o vídeo no mobile). */
export function createResponsiveQrScanConfig(
  fps: number = 10,
): Html5QrcodeCameraScanConfig {
  return {
    fps,
    qrbox: (viewfinderWidth, viewfinderHeight) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
      const size = Math.floor(Math.min(minEdge * 0.72, 260))
      const s = Math.max(Math.min(size, 260), 130)
      return { width: s, height: s }
    },
  }
}

export function toFriendlyCameraError(err: unknown): string {
  if (typeof err === 'string') {
    const lower = err.toLowerCase()
    if (lower.includes('insecure') || lower.includes('https')) {
      return 'É necessário usar HTTPS (ou localhost) para acessar a câmera.'
    }
    return err
  }
  if (err instanceof Error) {
    const name = (err as DOMException).name
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Permissão da câmera negada. Permita o acesso nas configurações do navegador ou do site.'
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'Nenhuma câmera foi encontrada neste dispositivo.'
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'A câmera não pôde ser aberta (pode estar em uso por outro aplicativo).'
    }
    if (name === 'OverconstrainedError') {
      return 'Este dispositivo não suporta a configuração de câmera solicitada.'
    }
    return err.message
  }
  return 'Não foi possível acessar a câmera.'
}

/**
 * Inicia o scanner priorizando a câmera traseira (environment).
 * Se falhar, tenta por lista de dispositivos; por último, câmera frontal (para não bloquear o check-in).
 */
export async function startHtml5QrcodeRearCamera(
  scanner: Html5Qrcode,
  scanConfig: Html5QrcodeCameraScanConfig,
  onSuccess: QrcodeSuccessCallback,
  onError: QrcodeErrorCallback,
): Promise<void> {
  try {
    await scanner.start(
      REAR_FACING_HTML5QRCODE,
      scanConfig,
      onSuccess,
      onError,
    )
    return
  } catch {
    // environment indisponível ou recusado — tenta lista de dispositivos / frontal
  }

  let cameras: Array<{ id: string; label: string }> = []
  try {
    cameras = await Html5Qrcode.getCameras()
  } catch (enumErr) {
    throw new Error(toFriendlyCameraError(enumErr))
  }

  if (cameras.length > 0) {
    try {
      const cameraId = pickRearCameraDeviceId(cameras)
      await scanner.start(cameraId, scanConfig, onSuccess, onError)
      return
    } catch (err) {
      const friendly = toFriendlyCameraError(err)
      // Último recurso: frontal
      try {
        await scanner.start(
          FRONT_FACING_HTML5QRCODE,
          scanConfig,
          onSuccess,
          onError,
        )
        return
      } catch {
        throw new Error(friendly)
      }
    }
  }

  try {
    await scanner.start(
      FRONT_FACING_HTML5QRCODE,
      scanConfig,
      onSuccess,
      onError,
    )
  } catch (err) {
    throw new Error(toFriendlyCameraError(err))
  }
}
