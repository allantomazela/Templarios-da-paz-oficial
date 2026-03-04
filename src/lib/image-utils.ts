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
    // If not an image, return original
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    // Timeout para carregar/processar (conexões lentas ou imagens muito grandes)
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout ao processar imagem. Tente com uma imagem menor (máx. 5 MB).'))
    }, 30000) // 30 segundos

    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    reader.onerror = (_e) => {
      clearTimeout(timeoutId)
      reject(new Error('Erro ao ler arquivo de imagem'))
    }

    img.onerror = () => {
      clearTimeout(timeoutId)
      reject(new Error('Erro ao carregar imagem. Verifique se o arquivo é uma imagem válida.'))
    }

    img.onload = () => {
      clearTimeout(timeoutId)
      // Calculate new dimensions based on the larger side
      let width = img.width
      let height = img.height
      const maxSide = Math.max(width, height)

      if (maxSide > maxWidth) {
        const scale = maxWidth / maxSide
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw image
      ctx.drawImage(img, 0, 0, width, height)

      // Timeout para conversão em blob (canvas grande pode demorar)
      const blobTimeout = setTimeout(() => {
        reject(new Error('Timeout ao converter imagem. Tente uma foto menor.'))
      }, 15000) // 15 segundos

      canvas.toBlob(
        (blob) => {
          clearTimeout(blobTimeout)
          if (!blob) {
            reject(new Error('Falha na compressão da imagem'))
            return
          }
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg', // Force convert to JPEG for consistency or keep original
            lastModified: Date.now(),
          })
          resolve(optimizedFile)
        },
        'image/jpeg',
        quality,
      )
    }

    reader.readAsDataURL(file)
  })
}
