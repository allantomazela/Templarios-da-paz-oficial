import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface BrotherOption {
  id: string
  full_name: string | null
}

interface BrotherSearchComboboxProps {
  brothers: BrotherOption[]
  value: string
  onChange: (brotherId: string) => void
  disabled?: boolean
  placeholder?: string
  loading?: boolean
  className?: string
}

export function BrotherSearchCombobox({
  brothers,
  value,
  onChange,
  disabled = false,
  placeholder = 'Selecione o irmão',
  loading = false,
  className,
}: BrotherSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = brothers.find((b) => b.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">
            {loading
              ? 'Carregando irmãos...'
              : selected?.full_name || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar irmão por nome..." />
          <CommandList>
            <CommandEmpty>Nenhum irmão encontrado.</CommandEmpty>
            <CommandGroup>
              {brothers.map((brother) => (
                <CommandItem
                  key={brother.id}
                  value={`${brother.full_name || 'Sem nome'} ${brother.id}`}
                  onSelect={() => {
                    onChange(brother.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === brother.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {brother.full_name || 'Sem nome'}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
