import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/format-utils'
import type { ForecastItem } from '@/lib/forecast-types'
import { paginateRows, totalPages } from '@/lib/forecast-projection'

const ITEMS_PER_PAGE = 8

const RECURRENCE_LABELS = {
  monthly: 'Mensal',
  annual: 'Anual',
  once: 'Única',
} as const

interface ForecastItemsManagerProps {
  items: ForecastItem[]
  onCreate: () => void
  onEdit: (item: ForecastItem) => void
  onDelete: (item: ForecastItem) => void
}

export function ForecastItemsManager({
  items,
  onCreate,
  onEdit,
  onDelete,
}: ForecastItemsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Receita' | 'Despesa'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredItems = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false
      if (activeFilter === 'active' && !item.isActive) return false
      if (activeFilter === 'inactive' && item.isActive) return false
      if (!search) return true
      return (
        item.description.toLowerCase().includes(search) ||
        (item.categoryName ?? '').toLowerCase().includes(search)
      )
    })
  }, [items, searchTerm, typeFilter, activeFilter])

  const pageCount = totalPages(filteredItems.length, ITEMS_PER_PAGE)
  const safePage = Math.min(currentPage, pageCount)
  const pageItems = paginateRows(filteredItems, safePage, ITEMS_PER_PAGE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row">
          <Input
            placeholder="Buscar contas fixas..."
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Receita">Receitas</SelectItem>
              <SelectItem value="Despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(value) => {
              setActiveFilter(value as typeof activeFilter)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ativos e inativos</SelectItem>
              <SelectItem value="active">Somente ativos</SelectItem>
              <SelectItem value="inactive">Somente inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova conta fixa
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Recorrência</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nenhuma conta fixa cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.categoryName ?? '—'}</TableCell>
                  <TableCell>{RECURRENCE_LABELS[item.recurrence]}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyBRL(item.expectedAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        aria-label="Editar conta fixa"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item)}
                        aria-label="Excluir conta fixa"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
