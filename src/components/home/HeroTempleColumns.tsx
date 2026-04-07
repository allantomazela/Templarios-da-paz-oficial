import { useId } from 'react'
import { cn } from '@/lib/utils'

interface IllustratedTempleColumnProps {
  variant: 'boaz' | 'jaquim'
  className?: string
}

/**
 * Colunas ilustradas do pórtico: Boaz (B) e Jaquim (J).
 * Ornamento visual; aria-label descreve o símbolo para leitores de tela.
 */
export function IllustratedTempleColumn({
  variant,
  className,
}: IllustratedTempleColumnProps) {
  const rawId = useId()
  const id = rawId.replace(/:/g, '')
  const isBoaz = variant === 'boaz'
  const letter = isBoaz ? 'B' : 'J'
  const ariaLabel = isBoaz
    ? 'Coluna Boaz — força e firmeza, à esquerda do pórtico'
    : 'Coluna Jaquim — estabelecimento e solidez, à direita do pórtico'

  const fluteXs = [41, 47.5, 54, 60.5, 67, 73.5, 80]

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        'flex w-full max-w-[7.5rem] items-end justify-center xl:max-w-[9rem]',
        className,
      )}
    >
      <svg
        viewBox="0 0 120 420"
        className="h-[min(52vh,400px)] w-full max-w-[9rem] drop-shadow-[0_4px_12px_hsl(var(--foreground)/0.08)] xl:h-[min(55vh,440px)]"
        aria-hidden
      >
        <defs>
          {/* Pedestal: pedra */}
          <linearGradient id={`${id}-step1`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(30 8% 52%)" />
            <stop offset="100%" stopColor="hsl(28 10% 38%)" />
          </linearGradient>
          <linearGradient id={`${id}-step2`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(32 9% 58%)" />
            <stop offset="100%" stopColor="hsl(30 10% 44%)" />
          </linearGradient>
          <linearGradient id={`${id}-step3`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(34 8% 64%)" />
            <stop offset="100%" stopColor="hsl(32 9% 48%)" />
          </linearGradient>
          {/* Cilindro do fuste: luz à esquerda */}
          <linearGradient id={`${id}-cylinder`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(35 6% 38%)" />
            <stop offset="18%" stopColor="hsl(38 10% 72%)" />
            <stop offset="42%" stopColor="hsl(36 8% 58%)" />
            <stop offset="62%" stopColor="hsl(34 9% 52%)" />
            <stop offset="82%" stopColor="hsl(32 8% 42%)" />
            <stop offset="100%" stopColor="hsl(28 7% 32%)" />
          </linearGradient>
          {/* Canelura (reentrância) */}
          <linearGradient id={`${id}-flute`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(28 10% 28% / 0.55)" />
            <stop offset="50%" stopColor="hsl(32 8% 22% / 0.75)" />
            <stop offset="100%" stopColor="hsl(28 10% 28% / 0.55)" />
          </linearGradient>
          {/* Capitel — mármore levemente mais claro */}
          <linearGradient id={`${id}-echinus`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(40 12% 78%)" />
            <stop offset="100%" stopColor="hsl(36 10% 58%)" />
          </linearGradient>
          <linearGradient id={`${id}-abacus`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(42 10% 82%)" />
            <stop offset="100%" stopColor="hsl(38 11% 62%)" />
          </linearGradient>
          {isBoaz ? (
            <radialGradient id={`${id}-globe`} cx="38%" cy="32%" r="68%">
              <stop offset="0%" stopColor="hsl(130 32% 48%)" />
              <stop offset="45%" stopColor="hsl(95 28% 34%)" />
              <stop offset="100%" stopColor="hsl(45 22% 28%)" />
            </radialGradient>
          ) : (
            <radialGradient id={`${id}-globe`} cx="42%" cy="28%" r="72%">
              <stop offset="0%" stopColor="hsl(220 48% 62%)" />
              <stop offset="40%" stopColor="hsl(245 40% 42%)" />
              <stop offset="100%" stopColor="hsl(260 35% 24%)" />
            </radialGradient>
          )}
          <linearGradient id={`${id}-globeHi`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 100% / 0.35)" />
            <stop offset="45%" stopColor="hsl(0 0% 100% / 0)" />
            <stop offset="100%" stopColor="hsl(0 0% 0% / 0.15)" />
          </linearGradient>
          <filter id={`${id}-letterEmboss`} x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" result="b" />
            <feOffset dx="0.6" dy="0.8" in="b" result="o" />
            <feFlood floodColor="hsl(0 0% 0% / 0.35)" result="f" />
            <feComposite in="f" in2="o" operator="in" result="s" />
            <feMerge>
              <feMergeNode in="s" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base em degraus (de baixo para cima) */}
        <rect
          x="4"
          y="398"
          width="112"
          height="20"
          rx="2"
          fill={`url(#${id}-step1)`}
          stroke="hsl(25 12% 22% / 0.45)"
          strokeWidth="0.75"
        />
        <rect
          x="12"
          y="378"
          width="96"
          height="20"
          rx="2"
          fill={`url(#${id}-step2)`}
          stroke="hsl(25 12% 22% / 0.4)"
          strokeWidth="0.65"
        />
        <rect
          x="20"
          y="348"
          width="80"
          height="30"
          rx="2"
          fill={`url(#${id}-step3)`}
          stroke="hsl(25 12% 22% / 0.35)"
          strokeWidth="0.65"
        />
        {/* Toro entre plinto e fuste */}
        <path
          d="M 34 348 Q 60 338 86 348 L 86 344 Q 60 334 34 344 Z"
          fill="hsl(36 9% 48%)"
          stroke="hsl(25 10% 28% / 0.35)"
          strokeWidth="0.5"
        />

        {/* Fuste: volume cilíndrico */}
        <rect
          x="33"
          y="132"
          width="54"
          height="216"
          rx="2.5"
          fill={`url(#${id}-cylinder)`}
          stroke="hsl(25 12% 24% / 0.5)"
          strokeWidth="0.85"
        />
        {/* Caneluras (7 sulcos verticais) */}
        {fluteXs.map((cx) => (
          <rect
            key={cx}
            x={cx - 1.15}
            y="134"
            width="2.3"
            height="212"
            rx="1"
            fill={`url(#${id}-flute)`}
            opacity="0.85"
          />
        ))}
        {/* Reflexo na arista iluminada */}
        <path
          d="M 33 134 Q 33 132 35 132 L 37 132 L 37 346 L 35 346 Q 33 346 33 344 Z"
          fill="hsl(42 15% 78% / 0.22)"
          style={{ pointerEvents: 'none' }}
        />

        {/* Anel de filé abaixo do capitel */}
        <rect
          x="36"
          y="124"
          width="48"
          height="5"
          rx="0.5"
          fill="hsl(38 10% 52%)"
          stroke="hsl(25 10% 26% / 0.4)"
          strokeWidth="0.4"
        />
        {/* Équino (trono do capitel dórico) */}
        <path
          d="M 28 124 C 28 118 36 112 60 112 C 84 112 92 118 92 124 L 90 128 C 88 122 72 118 60 118 C 48 118 32 122 30 128 Z"
          fill={`url(#${id}-echinus)`}
          stroke="hsl(28 10% 36% / 0.45)"
          strokeWidth="0.75"
        />
        {/* Ábaco */}
        <rect
          x="18"
          y="100"
          width="84"
          height="12"
          rx="1"
          fill={`url(#${id}-abacus)`}
          stroke="hsl(28 10% 34% / 0.5)"
          strokeWidth="0.85"
        />
        <line
          x1="18"
          y1="106"
          x2="102"
          y2="106"
          stroke="hsl(0 0% 0% / 0.08)"
          strokeWidth="0.5"
        />

        {/* Esfera com brilho direcional */}
        <circle
          cx="60"
          cy="58"
          r="31"
          fill={`url(#${id}-globe)`}
          stroke="hsl(25 12% 22% / 0.55)"
          strokeWidth="1.1"
        />
        <ellipse
          cx="51"
          cy="47"
          rx="17"
          ry="13"
          fill={`url(#${id}-globeHi)`}
          opacity="0.88"
        />

        {isBoaz ? (
          <>
            <ellipse
              cx="60"
              cy="58"
              rx="29"
              ry="11"
              fill="none"
              stroke="hsl(0 0% 0% / 0.2)"
              strokeWidth="0.65"
            />
            <path
              d="M 34 56 Q 60 44 86 56"
              fill="none"
              stroke="hsl(0 0% 0% / 0.15)"
              strokeWidth="0.55"
            />
          </>
        ) : (
          <>
            <path
              d="M 60 30 L 62.2 39 L 71 39 L 64.5 45 L 67 55 L 60 49 L 53 55 L 55.5 45 L 49 39 L 57.8 39 Z"
              fill="hsl(48 92% 68%)"
              stroke="hsl(42 80% 38% / 0.6)"
              strokeWidth="0.45"
            />
            <circle cx="82" cy="42" r="1.3" fill="hsl(0 0% 100% / 0.5)" />
            <circle cx="40" cy="48" r="1" fill="hsl(0 0% 100% / 0.35)" />
            <circle cx="72" cy="68" r="0.8" fill="hsl(0 0% 100% / 0.2)" />
          </>
        )}

        {/* Letra entalhada no fuste */}
        <text
          x="60"
          y="252"
          textAnchor="middle"
          fontSize="52"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fill="hsl(38 12% 42%)"
          stroke="hsl(42 20% 88% / 0.35)"
          strokeWidth="0.75"
          filter={`url(#${id}-letterEmboss)`}
          style={{ paintOrder: 'stroke fill' }}
        >
          {letter}
        </text>
      </svg>
    </div>
  )
}
