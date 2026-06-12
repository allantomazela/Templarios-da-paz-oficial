import QRCode from 'qrcode'

export interface TempleQrPrintContext {
  templeUrl: string
  lodgeName: string
  sessionTitle?: string
  sessionDate?: string
  sessionTime?: string
  sessionStatus?: 'open' | 'none'
}

export function getEffectiveTempleCheckinUrl(
  configuredUrl?: string | null,
): string {
  const trimmed = configuredUrl?.trim()
  if (trimmed) return trimmed
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/checkin-templo`
  }
  return '/checkin-templo'
}

export async function generateTempleQrDataUrl(
  url: string,
  size = 280,
): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function openTempleQrPrintWindow(
  dataUrl: string,
  context: TempleQrPrintContext,
): boolean {
  if (typeof window === 'undefined') return false

  const printWindow = window.open('', '_blank', 'width=520,height=720')
  if (!printWindow) return false

  const sessionBlock =
    context.sessionStatus === 'open' && context.sessionTitle
      ? `
    <p class="session-title">${escapeHtml(context.sessionTitle)}</p>
    <p class="session-meta">
      ${escapeHtml(context.sessionDate || '—')}
      ${context.sessionTime ? ` · ${escapeHtml(context.sessionTime)}` : ''}
    </p>`
      : `<p class="session-meta muted">Nenhuma sessão aberta no momento. Abra a presença em Chancelaria antes do check-in.</p>`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Check-in — ${escapeHtml(context.lodgeName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      font-family: Georgia, 'Times New Roman', serif;
      color: #111;
    }
    .sheet {
      max-width: 420px;
      margin: 0 auto;
      border: 2px solid #111;
      padding: 24px 20px;
      text-align: center;
    }
    .lodge { font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 8px; }
    h1 { font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .subtitle { font-size: 14px; margin: 0 0 16px; color: #333; }
    .session-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .session-meta { font-size: 14px; margin: 0 0 16px; }
    .session-meta.muted { color: #666; font-style: italic; }
    img { width: 280px; height: 280px; display: block; margin: 0 auto 16px; }
    .hint {
      font-size: 12px;
      line-height: 1.5;
      text-align: left;
      border-top: 1px solid #ccc;
      padding-top: 12px;
      margin-top: 8px;
    }
    .url { font-size: 10px; word-break: break-all; color: #555; margin-top: 12px; text-align: left; }
    @media print {
      body { padding: 0; }
      .sheet { border-width: 1px; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <p class="lodge">${escapeHtml(context.lodgeName)}</p>
    <h1>Registro de presença</h1>
    <p class="subtitle">Escaneie o QR Code com o celular (login necessário)</p>
    ${sessionBlock}
    <img id="qr-print-img" src="${dataUrl}" alt="QR Code check-in do Templo" width="280" height="280" />
    <div class="hint">
      <strong>Como usar:</strong> aponte a câmera para o QR ou acesse o link no navegador.
      É necessário estar a até 50 m do Templo e com a sessão aberta na Chancelaria.
    </div>
    <div class="url">${escapeHtml(context.templeUrl)}</div>
  </div>
  <script>
    (function () {
      function doPrint() {
        try { window.focus(); window.print(); } catch (e) {}
      }
      function schedulePrint() { setTimeout(doPrint, 200); }
      var img = document.getElementById('qr-print-img');
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

export async function downloadTempleQrPng(
  dataUrl: string,
  filename = 'qr-checkin-templo.png',
): Promise<void> {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
