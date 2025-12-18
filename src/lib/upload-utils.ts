import { supabase } from '@/lib/supabase/client'

/**
 * Uploads a file to Supabase Storage and returns the public URL.
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
  // Generate a unique file name to avoid collisions
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
