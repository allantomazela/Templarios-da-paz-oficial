import { Filter, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { BankAccount } from '@/lib/data'
import {
  buildTransactionFilterSummary,
  countActiveTransactionFilters,
  type TransactionListFilterState,
  type TransactionPeriodMode,
  type MembershipLinkFilterMode,
} from '@/lib/transaction-list-filters'
import { CONTRIBUTION_MONTHS } from '@/lib/contribution-payments'

interface BrotherOption {
  id: string
  name: string
}

interface TransactionListFiltersPanelProps {
  filters: TransactionListFilterState
  onChange: (patch: Partial<TransactionListFilterState>) => void
  onReset: () => void
  categories: string[]
  accounts: BankAccount[]
  accountNames: Record<string, string>
  brothers: BrotherOption[]
  brothersLoading?: boolean
  resultCount: number
  totalCount: number
  showMembershipLinkFilter?: boolean
  membershipLinksLoading?: boolean
}

const MEMBERSHIP_LINK_LABELS: Record<MembershipLinkFilterMode, string> = {
  all: 'Todos os vínculos',
  unlinked: 'Sem vínculo no cronograma',
}

const PERIOD_LABELS: Record<TransactionPeriodMode, string> = {
  all: 'Todos os períodos',
  day: 'Dia específico',
  month: 'Mês',
  year: 'Ano',
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, index) => CURRENT_YEAR - index + 1)

export function TransactionListFiltersPanel({
  filters,
  onChange,
  onReset,
  categories,
  accounts,
  accountNames,
  brothers,
  brothersLoading = false,
  resultCount,
  totalCount,
  showMembershipLinkFilter = false,
  membershipLinksLoading = false,
}: TransactionListFiltersPanelProps) {
  const activeCount = countActiveTransactionFilters(filters)
  const summary = buildTransactionFilterSummary(filters, accountNames)

  return (
    <div className="rounded-md border bg-card p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Filtros de conferência</p>
            <p className="text-xs text-muted-foreground">
              {resultCount} de {totalCount} lançamento(s)
              {summary ? ` — ${summary}` : ''}
            </p>
          </div>
          {activeCount > 0 && (
            <Badge variant="secondary">{activeCount} ativo(s)</Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={activeCount === 0}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="transaction-filter-period">Período</Label>
          <Select
            value={filters.periodMode}
            onValueChange={(value: TransactionPeriodMode) =>
              onChange({ periodMode: value })
            }
          >
            <SelectTrigger id="transaction-filter-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as TransactionPeriodMode[]).map(
                (mode) => (
                  <SelectItem key={mode} value={mode}>
                    {PERIOD_LABELS[mode]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {filters.periodMode === 'day' && (
          <div className="space-y-1.5">
            <Label htmlFor="transaction-filter-date">Data</Label>
            <Input
              id="transaction-filter-date"
              type="date"
              value={filters.filterDate}
              onChange={(event) => onChange({ filterDate: event.target.value })}
            />
          </div>
        )}

        {filters.periodMode === 'month' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="transaction-filter-month">Mês</Label>
              <Select
                value={String(filters.filterMonth)}
                onValueChange={(value) => onChange({ filterMonth: Number(value) })}
              >
                <SelectTrigger id="transaction-filter-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRIBUTION_MONTHS.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transaction-filter-month-year">Ano</Label>
              <Select
                value={String(filters.filterYear)}
                onValueChange={(value) => onChange({ filterYear: Number(value) })}
              >
                <SelectTrigger id="transaction-filter-month-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {filters.periodMode === 'year' && (
          <div className="space-y-1.5">
            <Label htmlFor="transaction-filter-year">Ano</Label>
            <Select
              value={String(filters.filterYear)}
              onValueChange={(value) => onChange({ filterYear: Number(value) })}
            >
              <SelectTrigger id="transaction-filter-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="transaction-filter-category">Categoria / tipo</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => onChange({ category: value })}
          >
            <SelectTrigger id="transaction-filter-category">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="transaction-filter-account">Conta</Label>
          <Select
            value={filters.accountId}
            onValueChange={(value) => onChange({ accountId: value })}
          >
            <SelectTrigger id="transaction-filter-account">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="transaction-filter-brother">Irmão</Label>
          <Select
            value={filters.brotherName}
            onValueChange={(value) => onChange({ brotherName: value })}
            disabled={brothersLoading}
          >
            <SelectTrigger id="transaction-filter-brother">
              <SelectValue
                placeholder={brothersLoading ? 'Carregando...' : 'Todos'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os irmãos</SelectItem>
              {brothers.map((brother) => (
                <SelectItem key={brother.id} value={brother.name}>
                  {brother.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showMembershipLinkFilter ? (
          <div className="space-y-1.5">
            <Label htmlFor="transaction-filter-membership-link">
              Vínculo no cronograma
            </Label>
            <Select
              value={filters.membershipLinkStatus}
              onValueChange={(value: MembershipLinkFilterMode) =>
                onChange({ membershipLinkStatus: value })
              }
              disabled={membershipLinksLoading}
            >
              <SelectTrigger id="transaction-filter-membership-link">
                <SelectValue
                  placeholder={
                    membershipLinksLoading ? 'Carregando...' : 'Todos'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MEMBERSHIP_LINK_LABELS) as MembershipLinkFilterMode[]).map(
                  (mode) => (
                    <SelectItem key={mode} value={mode}>
                      {MEMBERSHIP_LINK_LABELS[mode]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    </div>
  )
}
