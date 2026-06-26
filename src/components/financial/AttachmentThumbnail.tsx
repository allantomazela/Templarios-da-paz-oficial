import { useEffect, useRef, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import {
  getCachedAttachmentSignedUrl,
  isFinancialAttachmentImage,
  isFinancialAttachmentPdf,
  resolveFinancialAttachmentMimeType,
} from '@/lib/financial-attachment-access'
import { cn } from '@/lib/utils'

interface AttachmentThumbnailProps {
  thumbnailPath?: string | null
  fileName: string
  mimeType: string
  className?: string
}

export function AttachmentThumbnail({
  thumbnailPath,
  fileName,
  mimeType,
  className,
}: AttachmentThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const resolvedMime = resolveFinancialAttachmentMimeType({ mimeType, fileName })
  const isPdf = isFinancialAttachmentPdf(resolvedMime)
  const isImage = isFinancialAttachmentImage(resolvedMime)

  useEffect(() => {
    if (!thumbnailPath || !isImage) {
      setThumbUrl(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const element = containerRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setLoading(true)
      void getCachedAttachmentSignedUrl(thumbnailPath)
        .then((url) => {
          if (!cancelled) setThumbUrl(url)
        })
        .catch(() => {
          if (!cancelled) setFailed(true)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting)
        if (!isVisible || cancelled) return

        observer.disconnect()
        setLoading(true)
        void getCachedAttachmentSignedUrl(thumbnailPath)
          .then((url) => {
            if (!cancelled) setThumbUrl(url)
          })
          .catch(() => {
            if (!cancelled) setFailed(true)
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          })
      },
      { rootMargin: '80px' },
    )

    observer.observe(element)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [thumbnailPath, isImage])

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : thumbUrl ? (
        <img
          src={thumbUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : isPdf ? (
        <FileText className="h-5 w-5 text-red-600" />
      ) : isImage && !failed ? (
        <FileText className="h-5 w-5 text-muted-foreground" />
      ) : (
        <FileText className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  )
}
