import { useMemo, useState, type ReactNode } from 'react'
import { Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ALL_STATUSES,
  ALL_YEARS,
  attendanceYears,
  filterAttendanceItems,
  initialOpenMonthKeys,
  splitAttendanceByDate,
  type AttendanceListItem,
  type AttendanceStatusFilter,
  type SessionDisplayStatus,
} from '@/lib/attendance-presence-list'
import { EmptyState, MonthGroup, PresenceRows } from './AttendancePresenceRows'

const STATUS_OPTIONS: { value: AttendanceStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'nao_iniciada', label: 'Não iniciada' },
  { value: 'aberta', label: 'Aberta' },
  { value: 'finalizada', label: 'Finalizada' },
]

type AttendancePresenceListProps = {
  items: AttendanceListItem[]
  today: string
  showBatch: boolean
  onRefresh: () => void
  onOpenBatch: () => void
  renderStatus: (status: SessionDisplayStatus) => ReactNode
  renderActions: (item: AttendanceListItem, fullWidth?: boolean) => ReactNode
}

export function AttendancePresenceList({
  items,
  today,
  showBatch,
  onRefresh,
  onOpenBatch,
  renderStatus,
  renderActions,
}: AttendancePresenceListProps) {
  const [year, setYear] = useState(ALL_YEARS)
  const [status, setStatus] = useState<AttendanceStatusFilter>(ALL_STATUSES)
  const [query, setQuery] = useState('')

  const years = useMemo(() => attendanceYears(items), [items])
  const filtered = useMemo(
    () => filterAttendanceItems(items, { year, status, query }),
    [items, year, status, query],
  )
  const { upcoming, pastMonths } = useMemo(
    () => splitAttendanceByDate(filtered, today),
    [filtered, today],
  )
  const openMonths = useMemo(
    () => new Set(initialOpenMonthKeys(pastMonths, today)),
    [pastMonths, today],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Controle de Presença</h3>
          <p className="text-sm text-muted-foreground">
            Próximas sessões no topo, da mais perto para a mais distante. As
            anteriores ficam por mês, da última para a mais antiga.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {showBatch ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenBatch}
              title="Imprimir várias folhas A4 para colar no livro"
            >
              <Printer className="mr-2 h-4 w-4" />
              Folhas em lote
            </Button>
          ) : null}
          <Badge variant="secondary" className="text-sm">
            {filtered.length} evento{filtered.length === 1 ? '' : 's'}
          </Badge>
          <Button variant="outline" size="icon" onClick={onRefresh} title="Atualizar lista">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_12rem]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pelo nome do evento"
          aria-label="Buscar pelo nome do evento"
        />
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger aria-label="Filtrar por ano">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_YEARS}>Todos os anos</SelectItem>
            {years.map((entry) => (
              <SelectItem key={entry} value={entry}>
                {entry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as AttendanceStatusFilter)}
        >
          <SelectTrigger aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <EmptyState label="Nenhum evento agendado. Crie eventos na Agenda ou na seção Agenda da Loja para registrar presença." />
      ) : null}

      {items.length > 0 ? (
        <>
      <section className="space-y-2">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Próximas
        </h4>
        <PresenceRows
          items={upcoming}
          emptyLabel="Nenhuma sessão futura neste filtro."
          renderStatus={renderStatus}
          renderActions={renderActions}
        />
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Anteriores
        </h4>
        {pastMonths.length === 0 ? (
          <EmptyState label="Nenhuma sessão anterior neste filtro." />
        ) : (
          pastMonths.map((group) => (
            <MonthGroup
              key={group.key}
              group={group}
              defaultOpen={openMonths.has(group.key)}
              renderStatus={renderStatus}
              renderActions={renderActions}
            />
          ))
        )}
      </section>
        </>
      ) : null}
    </div>
  )
}

