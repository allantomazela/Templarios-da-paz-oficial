import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/** Meia folha A4 em retrato (mm). */
export const VISITOR_CERTIFICATE_WIDTH_MM = 210
export const VISITOR_CERTIFICATE_HEIGHT_MM = 148.5

export interface VisitorCertificateExportResult {
  jpegBlob: Blob
  pdfBlob: Blob
  jpegDataUrl: string
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

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve()
            return
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }),
    ),
  )
}

export function getVisitorCertificateCaptureElement(
  root: HTMLElement | null,
): HTMLElement | null {
  if (!root) return null
  return (
    root.querySelector<HTMLElement>(`.visitor-certificate-half-a4`) ?? root
  )
}

export async function exportVisitorCertificateAssets(
  element: HTMLElement,
): Promise<VisitorCertificateExportResult> {
  await waitForImages(element)

  const captureOptions = {
    scale: Math.min(window.devicePixelRatio || 2, 2),
    useCORS: true,
    backgroundColor: '#fdfbf7',
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

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92)
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar JPEG'))),
      'image/jpeg',
      0.92,
    )
  })

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [VISITOR_CERTIFICATE_WIDTH_MM, VISITOR_CERTIFICATE_HEIGHT_MM],
  })
  pdf.addImage(
    jpegDataUrl,
    'JPEG',
    0,
    0,
    VISITOR_CERTIFICATE_WIDTH_MM,
    VISITOR_CERTIFICATE_HEIGHT_MM,
  )
  const pdfBlob = pdf.output('blob')

  return { jpegBlob, pdfBlob, jpegDataUrl }
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
  jpegDataUrl: string,
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
      width: ${VISITOR_CERTIFICATE_WIDTH_MM}mm;
      height: ${VISITOR_CERTIFICATE_HEIGHT_MM}mm;
      background: #fff;
    }
    img {
      display: block;
      width: ${VISITOR_CERTIFICATE_WIDTH_MM}mm;
      height: ${VISITOR_CERTIFICATE_HEIGHT_MM}mm;
      object-fit: contain;
    }
    @page {
      size: ${VISITOR_CERTIFICATE_WIDTH_MM}mm ${VISITOR_CERTIFICATE_HEIGHT_MM}mm;
      margin: 0;
    }
    @media print {
      html, body {
        width: ${VISITOR_CERTIFICATE_WIDTH_MM}mm;
        height: ${VISITOR_CERTIFICATE_HEIGHT_MM}mm;
      }
    }
  </style>
</head>
<body>
  <img id="certificate-print-img" src="${jpegDataUrl}" alt="Certificado de presença" />
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
