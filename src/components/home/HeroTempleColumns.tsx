import { useId } from 'react'
import { cn } from '@/lib/utils'

interface IllustratedTempleColumnProps {
  variant: 'boaz' | 'jaquim'
  className?: string
}

/**
 * Colunas ilustradas do pórtico: Boaz (B) e Jaquim (J).
 * Topo: globo terrestre, tondo com inicial dourada; letras em ouro no fuste.
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
    ? 'Coluna Boaz — globo terrestre e inicial B em medalhão sobre o capitel'
    : 'Coluna Jaquim — globo terrestre e inicial J em medalhão sobre o capitel'

  const fluteCenters = [40, 45.5, 51, 56.5, 62, 67.5, 73, 78.5]

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
        className="h-[min(52vh,400px)] w-full max-w-[9rem] drop-shadow-[0_6px_16px_hsl(var(--foreground)/0.1)] xl:h-[min(55vh,440px)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${id}-gold`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="hsl(50 100% 82%)" />
            <stop offset="28%" stopColor="hsl(44 95% 62%)" />
            <stop offset="55%" stopColor="hsl(38 88% 48%)" />
            <stop offset="82%" stopColor="hsl(32 78% 38%)" />
            <stop offset="100%" stopColor="hsl(28 65% 26%)" />
          </linearGradient>
          <linearGradient id={`${id}-frame`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(38 22% 48%)" />
            <stop offset="40%" stopColor="hsl(42 18% 62%)" />
            <stop offset="100%" stopColor="hsl(28 20% 28%)" />
          </linearGradient>
          <radialGradient id={`${id}-tondoField`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="hsl(32 14% 28%)" />
            <stop offset="100%" stopColor="hsl(26 16% 14%)" />
          </radialGradient>
          <linearGradient id={`${id}-step1`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(28 10% 54%)" />
            <stop offset="55%" stopColor="hsl(30 9% 44%)" />
            <stop offset="100%" stopColor="hsl(26 11% 32%)" />
          </linearGradient>
          <linearGradient id={`${id}-step2`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(32 10% 60%)" />
            <stop offset="100%" stopColor="hsl(30 10% 42%)" />
          </linearGradient>
          <linearGradient id={`${id}-step3`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(34 9% 66%)" />
            <stop offset="100%" stopColor="hsl(32 10% 46%)" />
          </linearGradient>
          <linearGradient id={`${id}-cylinder`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(30 8% 32%)" />
            <stop offset="14%" stopColor="hsl(36 11% 76%)" />
            <stop offset="32%" stopColor="hsl(34 9% 58%)" />
            <stop offset="50%" stopColor="hsl(33 9% 52%)" />
            <stop offset="68%" stopColor="hsl(32 8% 46%)" />
            <stop offset="86%" stopColor="hsl(30 7% 36%)" />
            <stop offset="100%" stopColor="hsl(26 8% 26%)" />
          </linearGradient>
          <linearGradient id={`${id}-fluteShadow`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(24 12% 18% / 0.15)" />
            <stop offset="50%" stopColor="hsl(26 10% 12% / 0.72)" />
            <stop offset="100%" stopColor="hsl(24 12% 18% / 0.15)" />
          </linearGradient>
          <linearGradient id={`${id}-echinus`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(38 11% 84%)" />
            <stop offset="45%" stopColor="hsl(36 10% 68%)" />
            <stop offset="100%" stopColor="hsl(34 10% 52%)" />
          </linearGradient>
          <linearGradient id={`${id}-abacus`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(40 9% 88%)" />
            <stop offset="100%" stopColor="hsl(36 10% 62%)" />
          </linearGradient>
          <linearGradient id={`${id}-torus`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(34 10% 58%)" />
            <stop offset="100%" stopColor="hsl(32 9% 40%)" />
          </linearGradient>
          <filter id={`${id}-goldGlow`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" result="b" />
            <feOffset dx="0" dy="0.5" in="b" result="o" />
            <feFlood floodColor="hsl(45 90% 40% / 0.45)" result="f" />
            <feComposite in="f" in2="o" operator="in" result="s" />
            <feMerge>
              <feMergeNode in="s" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`${id}-earth`} cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor="hsl(200 62% 58%)" />
            <stop offset="45%" stopColor="hsl(210 55% 42%)" />
            <stop offset="100%" stopColor="hsl(222 48% 18%)" />
          </radialGradient>
          <linearGradient id={`${id}-earthHi`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 100% / 0.4)" />
            <stop offset="42%" stopColor="hsl(0 0% 100% / 0)" />
            <stop offset="100%" stopColor="hsl(0 0% 0% / 0.2)" />
          </linearGradient>
        </defs>

        {/* Base — degraus com frente mais clara (luz vinda da esquerda) */}
        <rect
          x="4"
          y="398"
          width="112"
          height="20"
          rx="2"
          fill={`url(#${id}-step1)`}
          stroke="hsl(22 14% 18% / 0.55)"
          strokeWidth="0.85"
        />
        <rect
          x="12"
          y="378"
          width="96"
          height="20"
          rx="2"
          fill={`url(#${id}-step2)`}
          stroke="hsl(22 14% 18% / 0.48)"
          strokeWidth="0.7"
        />
        <rect
          x="20"
          y="348"
          width="80"
          height="30"
          rx="2"
          fill={`url(#${id}-step3)`}
          stroke="hsl(22 14% 18% / 0.42)"
          strokeWidth="0.7"
        />
        <line
          x1="20"
          y1="356"
          x2="100"
          y2="356"
          stroke="hsl(0 0% 0% / 0.06)"
          strokeWidth="0.5"
        />

        {/* Toro / cimbre entre plinto e fuste */}
        <path
          d="M 32 348 Q 60 335 88 348 L 88 342 Q 60 329 32 342 Z"
          fill={`url(#${id}-torus)`}
          stroke="hsl(22 12% 22% / 0.45)"
          strokeWidth="0.65"
        />
        <path
          d="M 36 342 Q 60 333 84 342"
          fill="none"
          stroke="hsl(0 0% 100% / 0.12)"
          strokeWidth="0.6"
        />

        {/* Fuste — volume principal */}
        <rect
          x="32"
          y="132"
          width="56"
          height="216"
          rx="3"
          fill={`url(#${id}-cylinder)`}
          stroke="hsl(22 12% 20% / 0.55)"
          strokeWidth="1"
        />

        {/* Caneluras (sulcos côncavos) */}
        {fluteCenters.map((cx) => (
          <ellipse
            key={cx}
            cx={cx}
            cy="241"
            rx="2.1"
            ry="104"
            fill={`url(#${id}-fluteShadow)`}
          />
        ))}

        {/* Anéis de reforço (anuletos) */}
        {[168, 241, 314].map((y) => (
          <line
            key={y}
            x1="34"
            y1={y}
            x2="86"
            y2={y}
            stroke="hsl(0 0% 0% / 0.07)"
            strokeWidth="1.2"
          />
        ))}

        {/* Arista iluminada (cilindro) */}
        <path
          d="M 32 134 Q 32 132 34.5 132 L 38 132 L 38 346 L 34.5 346 Q 32 346 32 343 Z"
          fill="hsl(40 18% 82% / 0.18)"
          style={{ pointerEvents: 'none' }}
        />
        {/* Sombra de canto direito */}
        <path
          d="M 88 132 L 90.5 132 Q 88 132 88 134 L 88 346 Q 88 346 90.5 346 L 88 346 Z"
          fill="hsl(0 0% 0% / 0.12)"
          style={{ pointerEvents: 'none' }}
        />

        {/* Filé */}
        <rect
          x="35"
          y="124"
          width="50"
          height="6"
          rx="1"
          fill="hsl(34 9% 48%)"
          stroke="hsl(22 10% 22% / 0.4)"
          strokeWidth="0.45"
        />
        {/* Équino */}
        <path
          d="M 26 124 C 26 116 38 110 60 110 C 82 110 94 116 94 124 L 91 129 C 88 122 74 118 60 118 C 46 118 32 122 29 129 Z"
          fill={`url(#${id}-echinus)`}
          stroke="hsl(26 10% 32% / 0.5)"
          strokeWidth="0.85"
        />
        <path
          d="M 32 118 Q 60 114 88 118"
          fill="none"
          stroke="hsl(0 0% 100% / 0.35)"
          strokeWidth="0.5"
        />
        {/* Ábaco */}
        <rect
          x="16"
          y="100"
          width="88"
          height="12"
          rx="1.5"
          fill={`url(#${id}-abacus)`}
          stroke="hsl(26 10% 30% / 0.55)"
          strokeWidth="0.9"
        />
        <line
          x1="16"
          y1="106"
          x2="104"
          y2="106"
          stroke="hsl(0 0% 0% / 0.07)"
          strokeWidth="0.55"
        />
        <rect
          x="16"
          y="100"
          width="88"
          height="3"
          rx="1"
          fill="hsl(0 0% 100% / 0.2)"
          style={{ pointerEvents: 'none' }}
        />

        {/* Globo terrestre (acima do capitel) */}
        <g>
          <circle
            cx="60"
            cy="21"
            r="16.5"
            fill={`url(#${id}-earth)`}
            stroke="hsl(220 40% 16% / 0.65)"
            strokeWidth="1"
          />
          {/* Massas continentais estilizadas */}
          <ellipse
            cx="54"
            cy="19"
            rx="6"
            ry="4.5"
            fill="hsl(132 38% 36% / 0.88)"
            stroke="hsl(120 45% 22% / 0.35)"
            strokeWidth="0.35"
            transform="rotate(-18 54 19)"
          />
          <ellipse
            cx="66"
            cy="23"
            rx="5"
            ry="6"
            fill="hsl(118 36% 34% / 0.82)"
            stroke="hsl(110 40% 20% / 0.3)"
            strokeWidth="0.3"
            transform="rotate(12 66 23)"
          />
          <ellipse
            cx="58"
            cy="26"
            rx="3.5"
            ry="2.8"
            fill="hsl(95 32% 38% / 0.75)"
          />
          {/* Paralelo e meridiano */}
          <ellipse
            cx="60"
            cy="21"
            rx="16"
            ry="6.5"
            fill="none"
            stroke="hsl(0 0% 0% / 0.18)"
            strokeWidth="0.55"
          />
          <path
            d="M 44 21 Q 60 12 76 21"
            fill="none"
            stroke="hsl(0 0% 0% / 0.14)"
            strokeWidth="0.5"
          />
          <path
            d="M 60 5 Q 52 21 60 37 Q 68 21 60 5"
            fill="none"
            stroke="hsl(0 0% 0% / 0.12)"
            strokeWidth="0.45"
          />
          <ellipse
            cx="52"
            cy="16"
            rx="9"
            ry="7"
            fill={`url(#${id}-earthHi)`}
            opacity="0.85"
          />
        </g>

        {/* Pequeno suporte entre globo e medalhão */}
        <path
          d="M 56 37 L 58 44 L 62 44 L 64 37 Z"
          fill="hsl(34 10% 48%)"
          stroke="hsl(22 12% 22% / 0.45)"
          strokeWidth="0.4"
        />

        {/* Coroa de louro estilizada (atrás do tondo) */}
        <g opacity="0.85">
          <path
            d="M 32 66 Q 38 56 44 60 Q 40 52 46 48 Q 42 58 48 62 Q 46 50 52 46 Q 50 56 54 60"
            fill="none"
            stroke="hsl(88 28% 32% / 0.85)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 88 66 Q 82 56 76 60 Q 80 52 74 48 Q 78 58 72 62 Q 74 50 68 46 Q 70 56 66 60"
            fill="none"
            stroke="hsl(88 28% 32% / 0.85)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* Tondo arquitetônico: moldura + campo + inicial dourada */}
        <circle
          cx="60"
          cy="63"
          r="28"
          fill="none"
          stroke={`url(#${id}-frame)`}
          strokeWidth="4.5"
        />
        <circle
          cx="60"
          cy="63"
          r="23.5"
          fill={`url(#${id}-tondoField)`}
          stroke="hsl(22 14% 12% / 0.6)"
          strokeWidth="0.75"
        />
        <circle
          cx="60"
          cy="63"
          r="24.5"
          fill="none"
          stroke="hsl(0 0% 100% / 0.08)"
          strokeWidth="0.8"
        />
        <text
          x="60"
          y="75"
          textAnchor="middle"
          fontSize="30"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fill={`url(#${id}-gold)`}
          stroke="hsl(28 50% 18% / 0.35)"
          strokeWidth="0.4"
          filter={`url(#${id}-goldGlow)`}
          style={{ paintOrder: 'stroke fill' }}
        >
          {letter}
        </text>

        {/* Letra dourada no fuste */}
        <text
          x="60"
          y="252"
          textAnchor="middle"
          fontSize="52"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fill={`url(#${id}-gold)`}
          stroke="hsl(26 40% 14% / 0.45)"
          strokeWidth="0.85"
          filter={`url(#${id}-goldGlow)`}
          style={{ paintOrder: 'stroke fill' }}
        >
          {letter}
        </text>
      </svg>
    </div>
  )
}
