/** Cor de fundo dos ícones PWA (manifest background_color). */
export const PWA_ICON_BACKGROUND = '#1A202C'

const PWA_ICON_INNER_RATIO = 0.8

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem do logo.'))
    img.src = source
  })
}

/**
 * Gera PNG quadrado para PWA a partir de URL ou data URL do logo.
 */
export async function generatePwaIconBlob(
  imageSource: string,
  size: number,
  backgroundColor = PWA_ICON_BACKGROUND,
): Promise<Blob> {
  const img = await loadImage(imageSource)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas não disponível para gerar ícones PWA.')
  }

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, size, size)

  const inner = size * PWA_ICON_INNER_RATIO
  const scale = Math.min(inner / img.width, inner / img.height)
  const width = img.width * scale
  const height = img.height * scale
  const x = (size - width) / 2
  const y = (size - height) / 2
  ctx.drawImage(img, x, y, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao gerar ícone PWA.'))
          return
        }
        resolve(blob)
      },
      'image/png',
      1,
    )
  })
}

export const PWA_ICON_SIZES = [
  { size: 48, filename: 'favicon.png' },
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' },
] as const
