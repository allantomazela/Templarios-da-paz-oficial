import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { uploadToStorage } from '@/lib/upload-utils'
import { compressImage } from '@/lib/image-utils'
import { logError } from '@/lib/logger'

/** Tempo após o qual forçamos saída do estado de loading (evita loop infinito) */
const SAFETY_LOADING_MS = 70000

interface UseImageUploadOptions {
  /** Bucket do Supabase Storage (padrão: 'site-assets') */
  bucket?: string
  /** Pasta dentro do bucket (padrão: 'uploads') */
  folder?: string
  /** Tamanho máximo da imagem em pixels no maior lado (padrão: 1024) */
  maxSize?: number
  /** Tamanho máximo do arquivo em bytes antes da compressão (opcional). Ex.: 2 * 1024 * 1024 = 2 MB */
  maxFileSizeBytes?: number
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
    maxFileSizeBytes,
    quality = 0.8,
    successMessage = 'Imagem carregada com sucesso.',
    errorMessage = 'Não foi possível carregar a imagem.',
  } = options

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)
    }
  }, [])

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

      if (maxFileSizeBytes != null && file.size > maxFileSizeBytes) {
        const err = new Error(
          `Arquivo muito grande. O tamanho máximo permitido é ${Math.round(maxFileSizeBytes / (1024 * 1024))} MB.`,
        )
        setError(err)
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: err.message,
        })
        return null
      }

      setIsUploading(true)
      setError(null)
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = setTimeout(() => {
        safetyTimerRef.current = null
        setIsUploading(false)
        toast({
          variant: 'destructive',
          title: 'Upload cancelado',
          description: 'Demorou demais. Use uma imagem de até 800 px e 1 MB.',
        })
      }, SAFETY_LOADING_MS)

      try {
        const compressedFile = await compressImage(file, maxSize, quality)
        const publicUrl = await uploadToStorage(compressedFile, bucket, folder)
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current)
          safetyTimerRef.current = null
        }

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
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current)
          safetyTimerRef.current = null
        }
        const error = err instanceof Error ? err : new Error(String(err))
        logError('Error uploading image', error)
        setError(error)
        toast({
          variant: 'destructive',
          title: 'Erro no Upload',
          description: error instanceof Error ? error.message : errorMessage,
        })
        if (inputRef.current) inputRef.current.value = ''
        return null
      } finally {
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current)
          safetyTimerRef.current = null
        }
        setIsUploading(false)
      }
    },
    [bucket, folder, maxSize, maxFileSizeBytes, quality, successMessage, errorMessage, toast],
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

