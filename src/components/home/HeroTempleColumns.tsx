import { useId } from 'react'
import { cn } from '@/lib/utils'

interface IllustratedTempleColumnProps {
  variant: 'boaz' | 'jaquim'
  className?: string
}

/**
 * Colunas ilustradas do pórtico: Boaz (B, norte/esquerda) e Jaquim (J, sul/direita).
 * Ornamento visual; significado ritualístico é complementar ao conteúdo institucional.
 */
export function IllustratedTempleColumn({
  variant,
  className,
}: IllustratedTempleColumnProps) {
  const rawId = useId()
  const id = rawId.replace(/:/g, '')
  const isBoaz = variant === 'boaz'
  const label = isBoaz ? 'Boaz' : 'Jaquim'
  const letter = isBoaz ? 'B' : 'J'
  const ariaLabel = isBoaz
    ? 'Coluna Boaz — força e firmeza, à esquerda do pórtico'
    : 'Coluna Jaquim — estabelecimento e solidez, à direita do pórtico'

  return (
    <figure
      className={cn(
        'flex w-full max-w-[7.5rem] flex-col items-center justify-end xl:max-w-[9rem]',
        className,
      )}
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 120 400"
        className="h-[min(52vh,380px)] w-full max-w-[9rem] text-primary drop-shadow-sm xl:h-[min(55vh,420px)]"
        role="img"
        aria-hidden
      >
        <defs>
          <linearGradient
            id={`${id}-shaft`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.35)" />
            <stop offset="18%" stopColor="hsl(var(--primary) / 0.12)" />
            <stop offset="50%" stopColor="hsl(var(--primary) / 0.22)" />
            <stop offset="82%" stopColor="hsl(var(--primary) / 0.12)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.38)" />
          </linearGradient>
          <linearGradient id={`${id}-base`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted) / 0.9)" />
            <stop offset="100%" stopColor="hsl(var(--muted) / 0.45)" />
          </linearGradient>
          <linearGradient
            id={`${id}-capital`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.45)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.2)" />
          </linearGradient>
          {isBoaz ? (
            <radialGradient id={`${id}-globe`} cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="hsl(142 35% 42% / 0.85)" />
              <stop offset="55%" stopColor="hsl(88 28% 32% / 0.75)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.35)" />
            </radialGradient>
          ) : (
            <radialGradient id={`${id}-globe`} cx="45%" cy="30%" r="70%">
              <stop offset="0%" stopColor="hsl(230 45% 58% / 0.9)" />
              <stop offset="50%" stopColor="hsl(258 40% 38% / 0.75)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.4)" />
            </radialGradient>
          )}
          <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b" />
            <feOffset dx="0" dy="1" result="o" />
            <feMerge>
              <feMergeNode in="o" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base e plinto */}
        <rect
          x="8"
          y="368"
          width="104"
          height="24"
          rx="3"
          fill={`url(#${id}-base)`}
          stroke="hsl(var(--border) / 0.6)"
          strokeWidth="1"
        />
        <rect
          x="22"
          y="338"
          width="76"
          height="32"
          rx="2"
          fill="hsl(var(--muted) / 0.55)"
          stroke="hsl(var(--border) / 0.5)"
          strokeWidth="0.75"
        />

        {/* Fuste com caneluras */}
        <rect
          x="34"
          y="118"
          width="52"
          height="222"
          fill={`url(#${id}-shaft)`}
          stroke="hsl(var(--primary) / 0.25)"
          strokeWidth="0.75"
        />
        {[40, 48, 56, 64, 72, 80].map((x) => (
          <line
            key={x}
            x1={x}
            y1="120"
            x2={x}
            y2="338"
            stroke="hsl(var(--foreground) / 0.06)"
            strokeWidth="1.25"
          />
        ))}

        {/* Capitel */}
        <path
          d="M 24 118 L 34 118 L 38 102 L 82 102 L 86 118 L 96 118 L 90 94 L 30 94 Z"
          fill={`url(#${id}-capital)`}
          stroke="hsl(var(--primary) / 0.35)"
          strokeWidth="0.75"
        />
        <rect
          x="18"
          y="88"
          width="84"
          height="10"
          rx="1"
          fill="hsl(var(--primary) / 0.28)"
          stroke="hsl(var(--border) / 0.4)"
          strokeWidth="0.5"
        />
        <rect
          x="12"
          y="78"
          width="96"
          height="12"
          rx="2"
          fill="hsl(var(--muted) / 0.65)"
          stroke="hsl(var(--border) / 0.45)"
          strokeWidth="0.75"
        />

        {/* Esfera: terrestre (B) vs celeste (J) */}
        <circle
          cx="60"
          cy="52"
          r="30"
          fill={`url(#${id}-globe)`}
          stroke="hsl(var(--primary) / 0.4)"
          strokeWidth="1.25"
          filter={`url(#${id}-soft)`}
        />
        {isBoaz ? (
          <>
            <ellipse
              cx="60"
              cy="52"
              rx="28"
              ry="10"
              fill="none"
              stroke="hsl(var(--foreground) / 0.15)"
              strokeWidth="0.75"
            />
            <path
              d="M 32 52 Q 60 40 88 52"
              fill="none"
              stroke="hsl(var(--foreground) / 0.12)"
              strokeWidth="0.6"
            />
          </>
        ) : (
          <>
            <path
              d="M 60 28 L 62 36 L 70 36 L 64 41 L 66 49 L 60 44 L 54 49 L 56 41 L 50 36 L 58 36 Z"
              fill="hsl(48 90% 72% / 0.95)"
              stroke="hsl(48 70% 45% / 0.5)"
              strokeWidth="0.4"
            />
            <circle
              cx="78"
              cy="38"
              r="1.2"
              fill="hsl(var(--foreground) / 0.35)"
            />
            <circle
              cx="44"
              cy="44"
              r="0.9"
              fill="hsl(var(--foreground) / 0.25)"
            />
          </>
        )}

        {/* Letra no fuste */}
        <text
          x="60"
          y="248"
          textAnchor="middle"
          fontSize="56"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fill="hsl(var(--primary) / 0.55)"
          stroke="hsl(var(--background) / 0.4)"
          strokeWidth="0.5"
          style={{ paintOrder: 'stroke fill' }}
        >
          {letter}
        </text>
      </svg>
      <figcaption className="mt-1 max-w-[9rem] text-center font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground xl:text-[11px]">
        {label}
      </figcaption>
    </figure>
  )
}
