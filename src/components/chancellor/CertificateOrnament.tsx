/** Moldura do certificado. A unidade do viewBox é 1 mm no cartão de 20×15 cm. */
export function CertificateOrnament() {
  return (
    <svg
      className="certificate-ornament"
      viewBox="0 0 200 150"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect x="1.5" y="1.5" width="197" height="147" fill="none" stroke={WINE} strokeWidth="0.62" />
      <rect x="2.7" y="2.7" width="194.6" height="144.6" fill="none" stroke={GOLD} strokeWidth="0.2" />
      <rect x="8.1" y="8.1" width="183.8" height="133.8" fill="none" stroke={WINE} strokeWidth="0.38" />
      <rect x="9" y="9" width="182" height="132" fill="none" stroke={GOLD} strokeWidth="0.16" />
      <rect
        x="9.7"
        y="9.7"
        width="180.6"
        height="130.6"
        fill="none"
        stroke={WINE}
        strokeWidth="0.22"
        strokeDasharray="0.45 1.35"
        strokeLinecap="round"
      />

      <EdgeBraid axis="x" at={4.7} from={13} to={93} />
      <EdgeBraid axis="x" at={4.7} from={107} to={187} />
      <EdgeBraid axis="x" at={145.3} from={13} to={93} />
      <EdgeBraid axis="x" at={145.3} from={107} to={187} />
      <EdgeBraid axis="y" at={4.7} from={13} to={68} />
      <EdgeBraid axis="y" at={4.7} from={82} to={137} />
      <EdgeBraid axis="y" at={195.3} from={13} to={68} />
      <EdgeBraid axis="y" at={195.3} from={82} to={137} />

      <Medallion x={100} y={4.7} horizontal />
      <Medallion x={100} y={145.3} horizontal />
      <Medallion x={4.7} y={75} />
      <Medallion x={195.3} y={75} />

      {CORNERS.map((corner) => (
        <CornerBlock key={`${corner.x}-${corner.y}`} {...corner} />
      ))}
    </svg>
  )
}

function EdgeBraid({ axis, at, from, to }: EdgeBraidProps) {
  const stops = chainStops(from, to, 3.35)
  const point = (along: number, offset: number) =>
    axis === 'x' ? `${along} ${at + offset}` : `${at + offset} ${along}`
  const amplitude = 1.2
  const wave = (sign: 1 | -1) =>
    stops
      .slice(0, -1)
      .map((stop, index) => {
        const next = stops[index + 1]
        const mid = (stop + next) / 2
        return `M ${point(stop, 0)} Q ${point(mid, sign * amplitude)} ${point(next, 0)}`
      })
      .join(' ')

  return (
    <g>
      <path d={wave(1)} fill="none" stroke={WINE} strokeWidth="0.24" />
      <path d={wave(-1)} fill="none" stroke={GOLD} strokeWidth="0.18" />
      {stops.map((stop) => {
        const cx = axis === 'x' ? stop : at
        const cy = axis === 'x' ? at : stop
        return (
          <circle
            key={`${axis}-${at}-${stop}`}
            cx={cx}
            cy={cy}
            r="0.42"
            fill={GOLD}
            stroke={WINE}
            strokeWidth="0.12"
          />
        )
      })}
      {stops.slice(0, -1).map((stop, index) => {
        const next = stops[index + 1]
        const mid = (stop + next) / 2
        const cx = axis === 'x' ? mid : at + amplitude
        const cy = axis === 'x' ? at - amplitude : mid
        return <circle key={`peak-${axis}-${at}-${stop}`} cx={cx} cy={cy} r="0.2" fill={WINE} />
      })}
    </g>
  )
}

function Medallion({ x, y, horizontal = false }: MedallionProps) {
  const rx = horizontal ? 3.5 : 1.85
  const ry = horizontal ? 1.85 : 3.5
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={PARCHMENT} stroke={WINE} strokeWidth="0.28" />
      <ellipse
        cx={x}
        cy={y}
        rx={Math.max(rx - 0.7, 0.4)}
        ry={Math.max(ry - 0.7, 0.4)}
        fill="none"
        stroke={GOLD}
        strokeWidth="0.16"
      />
      <circle cx={x} cy={y} r="0.48" fill={WINE} />
    </g>
  )
}

function CornerBlock({ x, y, dx, dy }: Corner) {
  const at = (ix: number, iy: number) => `${x + dx * ix} ${y + dy * iy}`
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${at(10.2, 0)} L ${at(0, 0)} L ${at(0, 10.2)}`} stroke={WINE} strokeWidth="0.55" />
      <path d={`M ${at(10.2, 1.7)} L ${at(1.7, 1.7)} L ${at(1.7, 10.2)}`} stroke={GOLD} strokeWidth="0.22" />
      <path
        d={`M ${at(8.4, 3.2)} C ${at(4.6, 2.2)} ${at(2.5, 4.2)} ${at(3.6, 5.5)} C ${at(4.8, 6.9)} ${at(6.8, 4.8)} ${at(5.4, 3.7)}`}
        stroke={WINE}
        strokeWidth="0.32"
      />
      <path
        d={`M ${at(3.2, 8.4)} C ${at(2.2, 4.6)} ${at(4.2, 2.5)} ${at(5.5, 3.6)}`}
        stroke={GOLD}
        strokeWidth="0.2"
      />
      <circle cx={x + dx * 4.4} cy={y + dy * 4.4} r="1.2" fill={PARCHMENT} stroke={WINE} strokeWidth="0.22" />
      <circle cx={x + dx * 4.4} cy={y + dy * 4.4} r="0.45" fill={GOLD} stroke={WINE} strokeWidth="0.1" />
      <circle cx={x + dx * 8.8} cy={y + dy * 0.85} r="0.38" fill={WINE} />
      <circle cx={x + dx * 0.85} cy={y + dy * 8.8} r="0.38" fill={WINE} />
    </g>
  )
}

function chainStops(from: number, to: number, step: number): number[] {
  const stops: number[] = []
  for (let value = from; value <= to + 0.001; value += step) {
    stops.push(Math.round(value * 100) / 100)
  }
  return stops
}

interface EdgeBraidProps {
  axis: 'x' | 'y'
  at: number
  from: number
  to: number
}

interface MedallionProps {
  x: number
  y: number
  horizontal?: boolean
}

interface Corner {
  x: number
  y: number
  dx: 1 | -1
  dy: 1 | -1
}

const WINE = '#5b0303'
const GOLD = '#a6843d'
const PARCHMENT = '#f7f3ea'

const CORNERS: Corner[] = [
  { x: 2.3, y: 2.3, dx: 1, dy: 1 },
  { x: 197.7, y: 2.3, dx: -1, dy: 1 },
  { x: 2.3, y: 147.7, dx: 1, dy: -1 },
  { x: 197.7, y: 147.7, dx: -1, dy: -1 },
]
