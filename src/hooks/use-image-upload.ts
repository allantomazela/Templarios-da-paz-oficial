import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { uploadToStorage } from '@/lib/upload-utils'
import { compressImage } from '@/lib/image-utils'
import { logError } from '@/lib/logger'

interface UseImageUploadOptions {
  /** Bucket do Supabase Storage (padrão: 'site-assets') */
  bucket?: string
  /** Pasta dentro do bucket (padrão: 'uploads') */
  folder?: string
  /** Tamanho máximo da imagem em pixels (padrão: 1024) */
  maxSize?: number
  /** Qualidade de compressão 0-1 (padrão: 0.8) */
  quality?: number
  /** Mensagem de sucesso customizada */
  successMessage?: string
  /** Mensagem de erro customizada */
  errorMessage?: string
}

interface UseImageUploadReturn {
  /** URL da imagem após upload bem-sucedido */
  imageUrl: string | null
  /** Estado de carregamento */
  isUploading: boolean
  /** Erro ocorrido durante upload */
  error: Error | null
  /** Função para fazer upload da imagem */
  handleUpload: (file: File) => Promise<string | null>
  /** Função para resetar o estado */
  reset: () => void
  /** Ref para o input file (opcional) */
  inputRef: React.RefObject<HTMLInputElement>
}

/**
 * Hook para gerenciar upload de imagens com compressão e tratamento de erros
 * 
 * @param options - Opções de configuração do upload
 * @returns Objeto com estado e funções para gerenciar upload de imagens
 * 
 * @example
 * ```tsx
 * const { imageUrl, isUploading, handleUpload, inputRef } = useImageUpload({
 *   folder: 'avatars',
 *   maxSize: 512
 * })
 * 
 * return (
 *   <input
 *     ref={inputRef}
 *     type="file"
 *     accept="image/*"
 *     onChange={(e) => {
 *       const file = e.target.files?.[0]
 *       if (file) handleUpload(file)
 *     }}
 *   />
 * )
 * ```
 */
export function useImageUpload(
  options: UseImageUploadOptions = {},
): UseImageUploadReturn {
  const {
    bucket = 'site-assets',
    folder = 'uploads',
    maxSize = 1024,
    quality = 0.8,
    successMessage = 'Imagem carregada com sucesso.',
    errorMessage = 'Não foi possível carregar a imagem.',
  } = options

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) {
        const err = new Error('Arquivo deve ser uma imagem')
        setError(err)
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Por favor, selecione um arquivo de imagem.',
        })
        return null
      }

      setIsUploading(true)
      setError(null)

      try {
        // Compress image
        const compressedFile = await compressImage(file, maxSize, quality)

        // Upload to storage
        const publicUrl = await uploadToStorage(compressedFile, bucket, folder)

        setImageUrl(publicUrl)
        toast({
          title: 'Sucesso',
          description: successMessage,
        })

        // Reset input to allow selecting the same file again
        if (inputRef.current) {
          inputRef.current.value = ''
        }

        return publicUrl
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        logError('Error uploading image', error)
        setError(error)
        toast({
          variant: 'destructive',
          title: 'Erro no Upload',
          description: error instanceof Error ? error.message : errorMessage,
        })
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [bucket, folder, maxSize, quality, successMessage, errorMessage, toast],
  )

  const reset = useCallback(() => {
    setImageUrl(null)
    setError(null)
    setIsUploading(false)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  return {
    imageUrl,
    isUploading,
    error,
    handleUpload,
    reset,
    inputRef,
  }
}

