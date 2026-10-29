import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/** Cartão de presença no tamanho usual da loja: 20 cm × 15 cm. */
export const VISITOR_CERTIFICATE_WIDTH_MM = 200
export const VISITOR_CERTIFICATE_HEIGHT_MM = 150
export const VISITOR_CERTIFICATE_A4_WIDTH_MM = 297
export const VISITOR_CERTIFICATE_A4_HEIGHT_MM = 210
/**
 * Na folha A4 o cartão sai neste tamanho, sem ampliar.
 * A versão anterior (250×187,5 mm) encostava na margem e a impressora cortava a borda.
 */
export const VISITOR_CERTIFICATE_ON_A4_WIDTH_MM = VISITOR_CERTIFICATE_WIDTH_MM
export const VISITOR_CERTIFICATE_ON_A4_HEIGHT_MM = VISITOR_CERTIFICATE_HEIGHT_MM

/** Captura acima da tela para as logos não ficarem serrilhadas na impressão. */
const CERTIFICATE_CAPTURE_SCALE = 3

export const VISITOR_CERTIFICATE_WIDTH_CSS = `${VISITOR_CERTIFICATE_WIDTH_MM}mm`
export const VISITOR_CERTIFICATE_HEIGHT_CSS = `${VISITOR_CERTIFICATE_HEIGHT_MM}mm`

export interface VisitorCertificateExportResult {
  jpegBlob: Blob
  pdfBlob: Blob
  jpegDataUrl: string
  /** PNG em alta definição, usado na impressão e no PDF. */
  printDataUrl: string
}

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80)
}

export function buildVisitorCertificateFileBaseName(visitorName: string): string {
  const date = new Date().toISOString().slice(0, 10)
  const name = sanitizeFileName(visitorName) || 'Visitante'
  return `Certificado_Presenca_${name}_${date}`
}

export function buildBlankVisitorCertificateFileBaseName(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `Certificado_Presenca_Em_Branco_${date}`
}

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'))
  await Promise.all(
    images.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
      }
      if (typeof img.decode === 'function') {
        await img.decode().catch(() => undefined)
      }
    }),
  )
}

export function getVisitorCertificateCaptureElement(
  root: HTMLElement | null,
): HTMLElement | null {
  if (!root) return null
  return (
    root.querySelector<HTMLElement>(`.visitor-presence-card`) ?? root
  )
}

export async function exportVisitorCertificateAssets(
  element: HTMLElement,
): Promise<VisitorCertificateExportResult> {
  await waitForImages(element)

  const captureOptions = {
    scale: CERTIFICATE_CAPTURE_SCALE,
    useCORS: true,
    backgroundColor: '#f6f0e4',
    logging: false,
    width: element.offsetWidth,
    height: element.offsetHeight,
  } as const

  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(element, {
      ...captureOptions,
      allowTaint: false,
    })
  } catch {
    canvas = await html2canvas(element, {
      ...captureOptions,
      allowTaint: true,
    })
  }

  const printDataUrl = canvas.toDataURL('image/png')
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95)
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar JPEG'))),
      'image/jpeg',
      0.95,
    )
  })

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imageX = (pageWidth - VISITOR_CERTIFICATE_WIDTH_MM) / 2
  const imageY = (pageHeight - VISITOR_CERTIFICATE_HEIGHT_MM) / 2
  pdf.addImage(
    printDataUrl,
    'PNG',
    imageX,
    imageY,
    VISITOR_CERTIFICATE_WIDTH_MM,
    VISITOR_CERTIFICATE_HEIGHT_MM,
  )
  const pdfBlob = pdf.output('blob')

  return { jpegBlob, pdfBlob, jpegDataUrl, printDataUrl }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function openVisitorCertificatePrintWindow(
  printDataUrl: string,
  documentTitle: string,
): boolean {
  if (typeof window === 'undefined') return false

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return false

  const safeTitle = escapeHtml(documentTitle)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      margin: 0;
      height: 100%;
      background: #fff;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img {
      display: block;
      width: ${VISITOR_CERTIFICATE_WIDTH_MM}mm;
      height: ${VISITOR_CERTIFICATE_HEIGHT_MM}mm;
    }
    @page {
      size: A4 landscape;
      margin: 12mm;
    }
  </style>
</head>
<body>
  <img id="certificate-print-img" src="${printDataUrl}" alt="Certificado de presença" />
  <script>
    (function () {
      function doPrint() {
        try { window.focus(); window.print(); } catch (e) {}
      }
      function schedulePrint() { setTimeout(doPrint, 250); }
      var img = document.getElementById('certificate-print-img');
      window.addEventListener('afterprint', function () {
        try { window.close(); } catch (e) {}
      });
      if (img && img.complete && img.naturalHeight > 0) schedulePrint();
      else if (img) {
        img.onload = schedulePrint;
        img.onerror = function () { window.close(); };
      } else schedulePrint();
    })();
  </script>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  return true
}

export type VisitorCertificateShareMode =
  | 'native-shared'
  | 'whatsapp-with-downloads'
  | 'cancelled'

export function buildVisitorCertificateWhatsAppMessage(params: {
  visitorName: string
  lodgeTitle: string
  includeAttachmentHint?: boolean
}): string {
  const lines = [
    '*Certificado de Presença*',
    `*${params.lodgeTitle}*`,
    '',
    `Certificado do Ir∴ *${params.visitorName}*.`,
  ]

  if (params.includeAttachmentHint) {
    lines.push(
      '',
      '_Anexe nesta conversa os arquivos PDF e JPEG que foram baixados no seu dispositivo._',
    )
  }

  return lines.join('\n')
}

export function openWhatsAppShare(text: string): void {
  const encoded = encodeURIComponent(text)
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const url = isMobile
    ? `https://api.whatsapp.com/send?text=${encoded}`
    : `https://web.whatsapp.com/send?text=${encoded}`

  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

type NativeShareAttempt = 'shared' | 'failed' | 'cancelled'

async function tryNativeFileShare(
  files: File[],
  title: string,
  text: string,
): Promise<NativeShareAttempt> {
  if (typeof navigator.share !== 'function') return 'failed'
  if (
    typeof navigator.canShare === 'function' &&
    !navigator.canShare({ files })
  ) {
    return 'failed'
  }

  try {
    await navigator.share({ title, text, files })
    return 'shared'
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
    return 'failed'
  }
}

export async function shareVisitorCertificateFiles(params: {
  jpegBlob: Blob
  pdfBlob: Blob
  baseName: string
  title: string
  visitorName: string
  lodgeTitle: string
}): Promise<VisitorCertificateShareMode> {
  const jpegFile = new File([params.jpegBlob], `${params.baseName}.jpg`, {
    type: 'image/jpeg',
  })
  const pdfFile = new File([params.pdfBlob], `${params.baseName}.pdf`, {
    type: 'application/pdf',
  })

  const plainMessage = buildVisitorCertificateWhatsAppMessage({
    visitorName: params.visitorName,
    lodgeTitle: params.lodgeTitle,
  })

  const shareAttempts: File[][] = [[jpegFile], [pdfFile], [jpegFile, pdfFile]]

  for (const files of shareAttempts) {
    const result = await tryNativeFileShare(files, params.title, plainMessage)
    if (result === 'shared') return 'native-shared'
    if (result === 'cancelled') return 'cancelled'
  }

  downloadBlob(params.jpegBlob, `${params.baseName}.jpg`)
  window.setTimeout(() => {
    downloadBlob(params.pdfBlob, `${params.baseName}.pdf`)
  }, 350)

  openWhatsAppShare(
    buildVisitorCertificateWhatsAppMessage({
      visitorName: params.visitorName,
      lodgeTitle: params.lodgeTitle,
      includeAttachmentHint: true,
    }),
  )

  return 'whatsapp-with-downloads'
}
