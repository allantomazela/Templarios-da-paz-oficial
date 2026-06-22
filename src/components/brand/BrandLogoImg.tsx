import { useEffect, useState, type CSSProperties } from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveSiteLogoUrl } from '@/lib/default-brand-assets'
import { appendCacheBust } from '@/lib/brand-image-url'

/** Dimensões intrínsecas recomendadas para raster (retina no header ~56px CSS). */
export const BRAND_LOGO_INTRINSIC_SIZE = 512 as const

interface BrandLogoImgProps {
  logoUrl?: string | null
  alt: string
  className?: string
  fallbackClassName?: string
  loading?: 'eager' | 'lazy'
  decoding?: 'async' | 'auto'
  sizes?: string
  style?: CSSProperties
  /** Prioridade de fetch (ex.: `high` no logo acima da dobra / LCP). */
  fetchPriority?: 'high' | 'low' | 'auto'
  /**
   * width/height HTML reduzem CLS e ajudam o browser a dimensionar antes do decode.
   * Para logos raster, 512×512 é um bom padrão quando o CSS reduz a ~48–56px.
   */
  width?: number
  height?: number
  /** Força nova requisição da imagem (ex.: após upload). */
  cacheBustKey?: string | number
  /** Necessário para captura em canvas (certificado/exportação). */
  crossOrigin?: 'anonymous' | 'use-credentials'
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
  fetchPriority,
  width,
  height,
  cacheBustKey,
  crossOrigin,
}: BrandLogoImgProps) {
  const resolved = resolveSiteLogoUrl(logoUrl)
  const src =
    cacheBustKey != null && resolved && !resolved.startsWith('/')
      ? appendCacheBust(resolved, cacheBustKey)
      : resolved
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
      width={width}
      height={height}
      crossOrigin={crossOrigin}
      {...(fetchPriority ? { fetchPriority } : {})}
      onError={() => setFailed(true)}
    />
  )
}
