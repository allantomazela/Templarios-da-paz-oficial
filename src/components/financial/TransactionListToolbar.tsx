import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { cn } from '@/lib/utils'

interface TransactionListToolbarProps {
  searchPlaceholder: string
  searchTerm: string
  onSearchChange: (value: string) => void
  listTotalLabel: string
  listTotal: number
  listTotalClassName?: string
  actionLabel: string
  onAction: () => void
  actionClassName?: string
  actionVariant?: 'default' | 'destructive'
}

export function TransactionListToolbar({
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  listTotalLabel,
  listTotal,
  listTotalClassName,
  actionLabel,
  onAction,
  actionClassName,
  actionVariant = 'default',
}: TransactionListToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-8"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="rounded-md border bg-muted/40 px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">{listTotalLabel}</p>
          <p className={cn('text-lg font-bold font-mono', listTotalClassName)}>
            {formatCurrencyBRL(listTotal)}
          </p>
        </div>
        <Button
          onClick={onAction}
          variant={actionVariant === 'destructive' ? 'destructive' : undefined}
          className={actionVariant === 'default' ? actionClassName : undefined}
        >
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
