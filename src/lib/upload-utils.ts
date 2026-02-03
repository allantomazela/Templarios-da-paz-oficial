import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'

const UPLOAD_TIMEOUT_MS = 30000

/**
 * Uploads a file to Supabase Storage (direct upload).
 * A imagem já deve vir comprimida pelo chamador (ex.: useImageUpload usa compressImage antes).
 * @param file The file to upload
 * @param bucket The storage bucket name (default: 'site-assets')
 * @param folder The folder path within the bucket (default: 'uploads')
 * @returns Promise resolving to the public URL of the uploaded file
 */
export async function uploadToStorage(
  file: File,
  bucket: string = 'site-assets',
  folder: string = 'uploads',
): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`
  const contentType = file.type || 'application/octet-stream'

  const uploadPromise = supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    })

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error('Upload demorou muito. Tente novamente com uma imagem menor ou verifique a conexão.')),
      UPLOAD_TIMEOUT_MS,
    )
  })

  let result: { data: unknown; error: { message?: string } | null }
  try {
    result = await Promise.race([uploadPromise, timeoutPromise])
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload demorou muito.'
    logError('Upload timeout or error', err)
    throw new Error(msg)
  }

  const { error: uploadError } = result

  if (uploadError) {
    logError('Direct upload error', uploadError)
    throw new Error(
      'Falha no upload da imagem. Verifique se você está logado e tente novamente.',
    )
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
