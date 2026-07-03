import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Pencil, TrendingDown, FilePlus2 } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/format-utils'
import type { ForecastComparisonRow, ForecastLinkStatus } from '@/lib/forecast-types'
import {
  computeMonthEconomyTotal,
  filterForecastRows,
  getForecastRowStatusLabel,
  isForecastEconomyRow,
  paginateRows,
  totalPages,
} from '@/lib/forecast-projection'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | ForecastLinkStatus | 'economy'

const STATUS_VARIANT: Record<
  ForecastLinkStatus | 'economy',
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  ok: 'default',
  over: 'destructive',
  under: 'outline',
  economy: 'outline',
}

const ITEMS_PER_PAGE = 10

interface ForecastComparisonTableProps {
  rows: ForecastComparisonRow[]
  onEditOverride?: (row: ForecastComparisonRow) => void
  onCreatePayable?: (row: ForecastComparisonRow) => void
}

function getRowBadgeVariant(
  row: ForecastComparisonRow,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (isForecastEconomyRow(row)) return 'outline'
  return STATUS_VARIANT[row.linkStatus]
}

function getVarianceClassName(row: ForecastComparisonRow): string {
  if (isForecastEconomyRow(row)) {
    return 'font-semibold text-green-700 dark:text-green-400'
  }
  if (row.variance < 0) return 'text-destructive'
  if (row.variance > 0 && row.type === 'Receita') {
    return 'text-green-600 dark:text-green-400'
  }
  return ''
}

export function ForecastComparisonTable({
  rows,
  onEditOverride,
  onCreatePayable,
}: ForecastComparisonTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Receita' | 'Despesa'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const economyTotal = useMemo(() => computeMonthEconomyTotal(rows), [rows])
  const economyCount = useMemo(
    () => rows.filter(isForecastEconomyRow).length,
    [rows],
  )

  const filteredRows = useMemo(
    () =>
      filterForecastRows(rows, {
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
      }),
    [rows, searchTerm, typeFilter, statusFilter],
  )

  const pageCount = totalPages(filteredRows.length, ITEMS_PER_PAGE)
  const safePage = Math.min(currentPage, pageCount)
  const pageRows = paginateRows(filteredRows, safePage, ITEMS_PER_PAGE)

  return (
    <div className="space-y-4">
      {economyTotal > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-green-700 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">
              Economia no mês: {formatCurrencyBRL(economyTotal)}
            </p>
            <p className="text-sm text-green-700/90 dark:text-green-400/90">
              {economyCount}{' '}
              {economyCount === 1
                ? 'despesa ficou abaixo do previsto'
                : 'despesas ficaram abaixo do previsto'}
              . Use o filtro &quot;Economia&quot; para ver apenas esses lançamentos.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Buscar por descrição ou categoria..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value)
            setCurrentPage(1)
          }}
          className="md:max-w-sm"
        />
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as typeof typeFilter)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="md:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="Receita">Receitas</SelectItem>
            <SelectItem value="Despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as StatusFilter)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="over">Acima</SelectItem>
            <SelectItem value="under">Abaixo</SelectItem>
            <SelectItem value="economy">Economia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Previsto</TableHead>
              <TableHead className="text-right">Realizado</TableHead>
              <TableHead className="text-right">Variação</TableHead>
              <TableHead>Status</TableHead>
              {onEditOverride || onCreatePayable ? (
                <TableHead className="text-right">Ações</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={onEditOverride || onCreatePayable ? 8 : 7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum lançamento previsto para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const isEconomy = isForecastEconomyRow(row)
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      isEconomy &&
                        'border-l-4 border-l-green-500 bg-green-50/70 dark:bg-green-950/20',
                    )}
                  >
                    <TableCell>{row.dueDate.split('-').reverse().join('/')}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.description}</div>
                      {row.kind === 'membership' ? (
                        <span className="text-xs text-muted-foreground">
                          Automático do cronograma
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.categoryName}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(row.expectedAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(row.realizedAmount)}
                    </TableCell>
                    <TableCell className={cn('text-right', getVarianceClassName(row))}>
                      {formatCurrencyBRL(row.variance)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRowBadgeVariant(row)}
                        className={cn(
                          isEconomy &&
                            'border-green-600 bg-green-100 text-green-800 dark:border-green-500 dark:bg-green-950 dark:text-green-300',
                        )}
                      >
                        {getForecastRowStatusLabel(row)}
                      </Badge>
                    </TableCell>
                    {onEditOverride || onCreatePayable ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {onCreatePayable &&
                          row.type === 'Despesa' &&
                          row.kind === 'item' &&
                          row.linkStatus === 'pending' &&
                          row.forecastItemId ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => onCreatePayable(row)}
                            >
                              <FilePlus2 className="h-3.5 w-3.5" />
                              Conta a pagar
                            </Button>
                          ) : null}
                          {onEditOverride ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditOverride(row)}
                              aria-label="Ajustar previsto do mês"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setCurrentPage((page) => Math.max(1, page - 1))
                }}
              />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, index) => (
              <PaginationItem key={index + 1}>
                <PaginationLink
                  href="#"
                  isActive={safePage === index + 1}
                  onClick={(event) => {
                    event.preventDefault()
                    setCurrentPage(index + 1)
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setCurrentPage((page) => Math.min(pageCount, page + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
