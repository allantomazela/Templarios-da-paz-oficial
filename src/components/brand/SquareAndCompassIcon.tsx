interface SquareAndCompassIconProps {
  className?: string
  title?: string
}

/** Esquadro e Compasso com a letra G, em uma cor (currentColor), nítido em qualquer impressão. */
export function SquareAndCompassIcon({
  className,
  title = 'Esquadro e Compasso',
}: SquareAndCompassIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
    >
      <title>{title}</title>
      <polygon points="12,54 50,92 88,54 83.05,49.05 50,82.1 16.95,49.05" />
      <polygon points="47.6,12.5 51.2,14.2 26,79 23.6,77.6" />
      <polygon points="52.4,12.5 48.8,14.2 74,79 76.4,77.6" />
      <circle cx="50" cy="10" r="5.5" />
      <text
        x="50"
        y="59"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="21"
        fontWeight="700"
      >
        G
      </text>
    </svg>
  )
}
