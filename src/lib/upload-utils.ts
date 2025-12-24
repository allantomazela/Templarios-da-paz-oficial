import { supabase } from '@/lib/supabase/client'

/**
 * Uploads a file to Supabase Storage via Edge Function for optimization.
 * Fallbacks to direct upload if Edge Function fails or for non-image files.
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
  // Only attempt optimization for images
  if (file.type.startsWith('image/')) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      formData.append('folder', folder)

      // Create a promise that rejects after 8 seconds to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Edge Function request timed out')),
          8000,
        )
      })

      // Race the invoke call against the timeout
      const invokePromise = supabase.functions.invoke('optimize-image', {
        body: formData,
      })

      const response = (await Promise.race([
        invokePromise,
        timeoutPromise,
      ])) as any

      const { data, error } = response

      if (error) {
        console.warn(
          'Edge Function optimization failed, falling back to direct upload:',
          error,
        )
        // Throwing here will trigger the catch block which handles the fallback
        throw error
      }

      if (data?.publicUrl) {
        return data.publicUrl
      }
    } catch (e) {
      console.warn(
        'Error invoking optimize-image (or timeout), using fallback:',
        e,
      )
      // Continue to fallback implementation below
    }
  }

  // Direct upload fallback logic
  // Use a clean filename with timestamp to avoid collisions
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // Ensure content type is set correctly
  const contentType = file.type || 'application/octet-stream'

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: contentType,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Direct upload error:', uploadError)
    throw new Error('Falha no upload da imagem. Por favor, tente novamente.')
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
