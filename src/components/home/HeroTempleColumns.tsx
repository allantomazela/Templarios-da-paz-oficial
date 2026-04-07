import { useId } from 'react'
import { cn } from '@/lib/utils'

interface IllustratedTempleColumnProps {
  variant: 'boaz' | 'jaquim'
  className?: string
}

/**
 * Colunas ilustradas do pórtico: Boaz (B) e Jaquim (J), com romã sobre o ábaco.
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
    ? 'Coluna Boaz — força e firmeza; romã no topo do capitel'
    : 'Coluna Jaquim — estabelecimento e solidez; romã no topo do capitel'

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
            <radialGradient id={`${id}-pom`} cx="38%" cy="35%" r="72%">
              <stop offset="0%" stopColor="hsl(8 75% 52%)" />
              <stop offset="42%" stopColor="hsl(355 72% 38%)" />
              <stop offset="100%" stopColor="hsl(340 78% 18%)" />
            </radialGradient>
          ) : (
            <radialGradient id={`${id}-pom`} cx="42%" cy="32%" r="74%">
              <stop offset="0%" stopColor="hsl(330 62% 48%)" />
              <stop offset="45%" stopColor="hsl(312 58% 34%)" />
              <stop offset="100%" stopColor="hsl(285 55% 16%)" />
            </radialGradient>
          )}
          <linearGradient id={`${id}-pomHi`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 100% / 0.42)" />
            <stop offset="38%" stopColor="hsl(0 0% 100% / 0)" />
            <stop offset="100%" stopColor="hsl(0 0% 0% / 0.22)" />
          </linearGradient>
          <linearGradient id={`${id}-calyx`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(88 32% 44%)" />
            <stop offset="100%" stopColor="hsl(42 38% 28%)" />
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

        {/* Romã no topo do capitel (corpo + cálice) */}
        <g>
          {/* Coroa / cálice — atrás do fruto */}
          <path
            d="M 44 40 L 49 22 L 54 36 L 60 14 L 66 36 L 71 22 L 76 40 L 72 42 L 60 38 L 48 42 Z"
            fill={`url(#${id}-calyx)`}
            stroke="hsl(35 45% 20% / 0.55)"
            strokeWidth="0.65"
          />
          {/* Corpo da romã */}
          <path
            d="M 60 38 C 43 40 33 54 35 71 C 36 84 46 93 60 95 C 74 93 84 84 85 71 C 87 54 77 40 60 38 Z"
            fill={`url(#${id}-pom)`}
            stroke="hsl(25 70% 14% / 0.65)"
            strokeWidth="1"
          />
          <ellipse
            cx="50"
            cy="54"
            rx="16"
            ry="20"
            fill={`url(#${id}-pomHi)`}
            opacity="0.9"
          />
          {/* Grãos sugeridos (silhueta clássica) */}
          {[
            [52, 72],
            [58, 76],
            [66, 72],
            [56, 82],
            [64, 82],
            [60, 86],
            [48, 78],
            [72, 78],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="1.35"
              fill="hsl(355 85% 18% / 0.55)"
              stroke="hsl(0 0% 0% / 0.12)"
              strokeWidth="0.2"
            />
          ))}
        </g>

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
