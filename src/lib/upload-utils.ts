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
  // Only optimize images
  if (file.type.startsWith('image/')) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      formData.append('folder', folder)

      // Create a promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Edge Function request timed out')),
          10000,
        )
      })

      // Race the invoke call against the timeout
      const { data, error } = (await Promise.race([
        supabase.functions.invoke('optimize-image', {
          body: formData,
        }),
        timeoutPromise,
      ])) as any

      if (error) {
        console.warn(
          'Edge Function optimization failed, falling back to direct upload:',
          error,
        )
        // Fallback to direct upload below
      } else if (data?.publicUrl) {
        return data.publicUrl
      }
    } catch (e) {
      console.warn('Error invoking optimize-image (or timeout):', e)
      // Continue to fallback
    }
  }

  // Direct upload fallback
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new Error('Falha no upload da imagem')
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
