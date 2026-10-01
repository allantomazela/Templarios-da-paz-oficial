import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PasswordInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  /** Ícone decorativo à esquerda (ex.: cadeado). */
  leftIcon?: React.ReactNode
}

/** Campo de senha com botão para mostrar/ocultar o conteúdo digitado. */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    const label = visible ? 'Ocultar senha' : 'Mostrar senha'

    return (
      <div className="relative">
        {leftIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4"
          >
            {leftIcon}
          </span>
        )}
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          className={cn(leftIcon && 'pl-9', 'pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={label}
          aria-pressed={visible}
          title={label}
          className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
