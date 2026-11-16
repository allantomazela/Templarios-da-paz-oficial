import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FinancialAmountVisibilityToggleProps {
  amountsVisible: boolean
  onToggle: () => void
  className?: string
}

/** Olhinho para mostrar/ocultar totais financeiros (apresentação / local público). */
export function FinancialAmountVisibilityToggle({
  amountsVisible,
  onToggle,
  className,
}: FinancialAmountVisibilityToggleProps) {
  const label = amountsVisible
    ? 'Ocultar valores'
    : 'Mostrar valores'

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('gap-2', className)}
      onClick={onToggle}
      aria-pressed={!amountsVisible}
      aria-label={label}
      title={label}
    >
      {amountsVisible ? (
        <Eye className="h-4 w-4" aria-hidden="true" />
      ) : (
        <EyeOff className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
