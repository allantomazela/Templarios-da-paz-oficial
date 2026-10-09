import * as React from 'react'

import { Input } from '@/components/ui/input'
import { formatPersonName } from '@/lib/person-name'

interface PersonNameInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value?: string | null
  onChange: (value: string) => void
}

/**
 * Campo de nome de pessoa compatível com `{...field}` do react-hook-form.
 * Formata ao sair do campo (não a cada tecla) para não engolir o espaço entre os nomes.
 */
const PersonNameInput = React.forwardRef<HTMLInputElement, PersonNameInputProps>(
  ({ value, onChange, onBlur, ...props }, ref) => {
    function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
      const formatted = formatPersonName(value)
      if (formatted !== (value ?? '')) onChange(formatted)
      onBlur?.(event)
    }

    return (
      <Input
        ref={ref}
        autoComplete="name"
        {...props}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        onBlur={handleBlur}
      />
    )
  },
)
PersonNameInput.displayName = 'PersonNameInput'

export { PersonNameInput }
