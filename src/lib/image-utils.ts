/**
 * Compresses and resizes an image file to ensure optimization.
 * @param file The original file
 * @param maxWidth The maximum dimension (larger side) of the output image (default: 1200)
 * @param quality The quality of the output image (0 to 1, default: 0.8)
 * @returns A promise that resolves to the optimized File
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.8,
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    const cleanup = () => URL.revokeObjectURL(objectUrl)

    const timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout ao processar imagem. Tente com uma imagem menor (máx. 5 MB).'))
    }, 30000)

    img.onerror = () => {
      clearTimeout(timeoutId)
      cleanup()
      reject(new Error('Erro ao carregar imagem. Verifique se o arquivo é uma imagem válida.'))
    }

    img.onload = () => {
      clearTimeout(timeoutId)
      let width = img.width
      let height = img.height
      const maxSide = Math.max(width, height)

      if (maxSide > maxWidth) {
        const scale = maxWidth / maxSide
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        cleanup()
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      const blobTimeout = setTimeout(() => {
        cleanup()
        reject(new Error('Timeout ao converter imagem. Tente uma foto menor.'))
      }, 15000)

      canvas.toBlob(
        (blob) => {
          clearTimeout(blobTimeout)
          cleanup()
          if (!blob) {
            reject(new Error('Falha na compressão da imagem'))
            return
          }
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(optimizedFile)
        },
        'image/jpeg',
        quality,
      )
    }

    img.src = objectUrl
  })
}

/** Lado máximo do logo após redimensionar (boa nitidez em retina com ~56px CSS no header). */
export const LOGO_UPLOAD_MAX_SIDE = 768

const LOGO_JPEG_QUALITY = 0.88

/**
 * Otimiza arquivo de logo para upload: até 768px no maior lado, JPEG com boa qualidade
 * ou PNG quando a origem é PNG/WebP/GIF (preserva transparência). SVG é enviado sem alteração.
 */
export async function compressLogoForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }
  if (file.type === 'image/svg+xml') {
    return file
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          'Timeout ao processar o logo. Tente com uma imagem menor (máx. 5 MB).',
        ),
      )
    }, 30000)

    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      clearTimeout(timeoutId)
      reject(new Error('Erro ao ler arquivo de imagem'))
    }

    img.onerror = () => {
      clearTimeout(timeoutId)
      reject(
        new Error(
          'Erro ao carregar imagem. Verifique se o arquivo é uma imagem válida.',
        ),
      )
    }

    img.onload = () => {
      clearTimeout(timeoutId)
      let width = img.width
      let height = img.height
      const maxSide = Math.max(width, height)

      if (maxSide > LOGO_UPLOAD_MAX_SIDE) {
        const scale = LOGO_UPLOAD_MAX_SIDE / maxSide
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      if (
        file.type === 'image/png' ||
        file.type === 'image/webp' ||
        file.type === 'image/gif'
      ) {
        ctx.clearRect(0, 0, width, height)
      }
      ctx.drawImage(img, 0, 0, width, height)

      const usePng =
        file.type === 'image/png' ||
        file.type === 'image/webp' ||
        file.type === 'image/gif'

      const blobTimeout = setTimeout(() => {
        reject(new Error('Timeout ao converter logo.'))
      }, 15000)

      const baseName =
        file.name.replace(/\.[^.]+$/i, '').trim() || 'logo'
      const mime: 'image/png' | 'image/jpeg' = usePng
        ? 'image/png'
        : 'image/jpeg'

      canvas.toBlob(
        (blob) => {
          clearTimeout(blobTimeout)
          if (!blob) {
            reject(new Error('Falha ao processar o logo'))
            return
          }
          const outName = usePng ? `${baseName}.png` : `${baseName}.jpg`
          resolve(
            new File([blob], outName, {
              type: mime,
              lastModified: Date.now(),
            }),
          )
        },
        mime,
        usePng ? undefined : LOGO_JPEG_QUALITY,
      )
    }

    reader.readAsDataURL(file)
  })
}
