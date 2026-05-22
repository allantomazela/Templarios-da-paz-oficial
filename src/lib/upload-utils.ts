import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'
import { toErrorMessage, withTimeout } from '@/lib/async-utils'

/** 5 minutos: permite envio em conexões lentas (ex.: foto de irmão no cadastro) */
const UPLOAD_TIMEOUT_MS = 300000

/**
 * Uploads a file to Supabase Storage (direct upload).
 * A imagem já deve vir comprimida pelo chamador (ex.: useImageUpload usa compressImage antes).
 * @param file The file to upload
 * @param bucket The storage bucket name (default: 'site-assets')
 * @param folder The folder path within the bucket (default: 'uploads')
 * @returns Promise resolving to the public URL of the uploaded file
 */
/**
 * Upload de foto de perfil via Edge Function (contorna RLS do Storage para membros).
 */
export async function uploadAvatarToStorage(file: File): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Faça login para enviar a foto de perfil.')
  }

  const formData = new FormData()
  formData.append('file', file)

  const { data, error } = await supabase.functions.invoke('upload-avatar', {
    body: formData,
  })

  if (error) {
    logError('Avatar edge upload error', error)
    throw new Error(
      toErrorMessage(
        error,
        'Falha no upload da foto. Verifique se a função upload-avatar está publicada no Supabase.',
      ),
    )
  }

  const payload = data as { publicUrl?: string; error?: string } | null
  if (!payload?.publicUrl) {
    throw new Error(
      payload?.error ||
        'Falha no upload da foto. Verifique se a função upload-avatar está publicada no Supabase.',
    )
  }

  return payload.publicUrl
}

export async function uploadToStorage(
  file: File,
  bucket: string = 'site-assets',
  folder: string = 'uploads',
): Promise<string> {
  if (
    bucket === 'site-assets' &&
    (folder === 'avatars' || folder.startsWith('avatars/'))
  ) {
    return uploadAvatarToStorage(file)
  }

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

  const timeoutMessage =
    'Upload demorou muito. Tente uma imagem menor (máx. 1200 px e 5 MB) ou verifique sua conexão e tente novamente.'

  let result: { data: unknown; error: { message?: string } | null }
  try {
    result = await withTimeout(uploadPromise, UPLOAD_TIMEOUT_MS, timeoutMessage)
  } catch (err) {
    const msg = toErrorMessage(err, 'Upload demorou muito.')
    logError('Upload timeout or error', err)
    throw new Error(msg)
  }

  const { error: uploadError } = result

  if (uploadError) {
    logError('Direct upload error', uploadError)
    throw new Error(
      toErrorMessage(
        uploadError,
        'Falha no upload da imagem. Verifique se você está logado e tente novamente.',
      ),
    )
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
