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

const rearFacingConstraints: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
}

/**
 * Inicia o scanner priorizando a câmera traseira (environment).
 * Se o navegador não aceitar constraints, cai para escolha por lista de dispositivos.
 */
export async function startHtml5QrcodeRearCamera(
  scanner: Html5Qrcode,
  scanConfig: Html5QrcodeCameraScanConfig,
  onSuccess: QrcodeSuccessCallback,
  onError: QrcodeErrorCallback,
): Promise<void> {
  try {
    await scanner.start(
      rearFacingConstraints,
      scanConfig,
      onSuccess,
      onError,
    )
    return
  } catch {
    // Alguns desktop / WebViews não aplicam facingMode; segue com deviceId
  }

  const cameras = await Html5Qrcode.getCameras()
  if (!cameras?.length) {
    throw new Error('Nenhuma câmera encontrada.')
  }
  const cameraId = pickRearCameraDeviceId(cameras)
  await scanner.start(cameraId, scanConfig, onSuccess, onError)
}
