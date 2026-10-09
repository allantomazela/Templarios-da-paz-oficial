import { cn } from '@/lib/utils'

/** Emblema oficial (Esquadro e Compasso com a letra G) em `public/`. */
export const SQUARE_AND_COMPASS_URL = '/esquadro-compasso.png' as const

interface SquareAndCompassIconProps {
  className?: string
  title?: string
}

/** `loading="eager"`: a imagem precisa estar carregada quando a página vai para a impressão. */
export function SquareAndCompassIcon({
  className,
  title = 'Esquadro e Compasso',
}: SquareAndCompassIconProps) {
  return (
    <img
      src={SQUARE_AND_COMPASS_URL}
      alt={title}
      className={cn('object-contain', className)}
      loading="eager"
      decoding="async"
      width={512}
      height={512}
    />
  )
}
