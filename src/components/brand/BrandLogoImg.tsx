import { useEffect, useState, type CSSProperties } from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveSiteLogoUrl } from '@/lib/default-brand-assets'

interface BrandLogoImgProps {
  logoUrl?: string | null
  alt: string
  className?: string
  fallbackClassName?: string
  loading?: 'eager' | 'lazy'
  decoding?: 'async' | 'auto'
  sizes?: string
  style?: CSSProperties
}

export function BrandLogoImg({
  logoUrl,
  alt,
  className,
  fallbackClassName,
  loading = 'lazy',
  decoding = 'async',
  sizes,
  style,
}: BrandLogoImgProps) {
  const src = resolveSiteLogoUrl(logoUrl)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (failed) {
    return (
      <ShieldCheck
        className={cn('shrink-0 text-primary', fallbackClassName)}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      sizes={sizes}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}
