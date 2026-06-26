import {
  isFinancialAttachmentImage,
  resolveFinancialAttachmentMimeType,
} from '@/lib/financial-attachment-access'

export const COMPRESS_THRESHOLD_BYTES = 400 * 1024
export const MAX_IMAGE_DIMENSION = 2400
export const THUMBNAIL_MAX_DIMENSION = 320
const COMPRESS_QUALITY = 0.85
const THUMBNAIL_QUALITY = 0.75

export interface PreparedFinancialImageUpload {
  file: File
  thumbnail: File | null
  wasCompressed: boolean
}

export function isFinancialImageUpload(file: File): boolean {
  const mimeType = resolveFinancialAttachmentMimeType({
    mimeType: file.type,
    fileName: file.name,
  })
  return isFinancialAttachmentImage(mimeType)
}

export function shouldCompressImage(fileSize: number, maxSide: number): boolean {
  return fileSize > COMPRESS_THRESHOLD_BYTES || maxSide > MAX_IMAGE_DIMENSION
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    image.src = objectUrl
  })
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string,
  quality?: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao processar a imagem.'))
          return
        }
        resolve(new File([blob], fileName, { type: mimeType }))
      },
      mimeType,
      quality,
    )
  })
}

function scaleToFit(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const maxSide = Math.max(width, height)
  if (maxSide <= maxDimension) {
    return { width, height }
  }

  const ratio = maxDimension / maxSide
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

function drawImageToCanvas(
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas não suportado neste navegador.')
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)
  return canvas
}

function buildCompressedFileName(originalName: string, mimeType: string): string {
  const baseName = originalName.replace(/\.[^.]+$/, '')
  if (mimeType === 'image/webp') return `${baseName}.webp`
  if (mimeType === 'image/png') return `${baseName}.png`
  return `${baseName}.jpg`
}

function buildThumbnailFileName(originalName: string): string {
  const baseName = originalName.replace(/\.[^.]+$/, '')
  return `${baseName}-thumb.webp`
}

function resolveCompressedMimeType(file: File): string {
  const mimeType = resolveFinancialAttachmentMimeType({
    mimeType: file.type,
    fileName: file.name,
  })

  if (mimeType === 'image/png') return 'image/webp'
  if (mimeType === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

async function renderResizedImageFile(
  file: File,
  maxDimension: number,
  mimeType: string,
  quality: number,
  outputFileName: string,
): Promise<File> {
  const image = await loadImageElement(file)
  const { width, height } = scaleToFit(image.naturalWidth, image.naturalHeight, maxDimension)
  const canvas = drawImageToCanvas(image, width, height)
  return canvasToFile(canvas, outputFileName, mimeType, quality)
}

export async function prepareFinancialImageUpload(
  file: File,
): Promise<PreparedFinancialImageUpload> {
  if (typeof document === 'undefined' || !isFinancialImageUpload(file)) {
    return { file, thumbnail: null, wasCompressed: false }
  }

  const image = await loadImageElement(file)
  const maxSide = Math.max(image.naturalWidth, image.naturalHeight)
  const needsCompression = shouldCompressImage(file.size, maxSide)

  let outputFile = file
  if (needsCompression) {
    const mimeType = resolveCompressedMimeType(file)
    outputFile = await renderResizedImageFile(
      file,
      MAX_IMAGE_DIMENSION,
      mimeType,
      COMPRESS_QUALITY,
      buildCompressedFileName(file.name, mimeType),
    )
  }

  const thumbnail = await renderResizedImageFile(
    outputFile,
    THUMBNAIL_MAX_DIMENSION,
    'image/webp',
    THUMBNAIL_QUALITY,
    buildThumbnailFileName(file.name),
  )

  return {
    file: outputFile,
    thumbnail,
    wasCompressed: needsCompression || outputFile.size < file.size,
  }
}
