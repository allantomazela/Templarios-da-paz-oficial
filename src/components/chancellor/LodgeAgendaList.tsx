import { useMemo, useState } from 'react'
import { ChevronDown, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { Event } from '@/lib/data'
import { ALL_YEARS, initialOpenMonthKeys } from '@/lib/attendance-presence-list'
import { formatDateBR } from '@/lib/format-utils'
import {
  filterLodgeEvents,
  lodgeEventYears,
  splitLodgeEvents,
} from '@/lib/lodge-agenda-list'
import { EmptyState } from './AttendancePresenceRows'

type LodgeAgendaListProps = {
  events: Event[]
  today: string
  onCreate: () => void
  onEdit: (event: Event) => void
  onDelete: (id: string) => void
}

export function LodgeAgendaList({
  events,
  today,
  onCreate,
  onEdit,
  onDelete,
}: LodgeAgendaListProps) {
  const [year, setYear] = useState(ALL_YEARS)
  const [query, setQuery] = useState('')
  const years = useMemo(() => lodgeEventYears(events), [events])
  const filtered = useMemo(
    () => filterLodgeEvents(events, { year, query }),
    [events, year, query],
  )
  const { upcoming, pastMonths } = useMemo(
    () => splitLodgeEvents(filtered, today),
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
          <h3 className="text-lg font-semibold">Agenda da Loja</h3>
          <p className="text-sm text-muted-foreground">
            Próximos eventos no topo, da mais perto para a mais distante. Os
            anteriores ficam por mês, da última para a mais antiga.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="secondary" className="text-sm">
            {filtered.length} evento{filtered.length === 1 ? '' : 's'}
          </Badge>
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Evento / Sessão
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            className="pl-8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar eventos"
          />
        </div>
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
      </div>

      {events.length === 0 ? <EmptyState label="Nenhum evento encontrado." /> : null}

      {events.length > 0 ? (
        <>
          <section className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Próximas
            </h4>
            <EventRows
              events={upcoming}
              emptyLabel="Nenhum evento futuro neste filtro."
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </section>
          <section className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Anteriores
            </h4>
            {pastMonths.length === 0 ? (
              <EmptyState label="Nenhum evento anterior neste filtro." />
            ) : (
              pastMonths.map((group) => (
                <Collapsible key={group.key} defaultOpen={openMonths.has(group.key)}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm font-medium hover:bg-accent data-[state=open]:[&_svg]:rotate-180">
                    <span>
                      {group.label}
                      <span className="ml-2 text-muted-foreground">({group.items.length})</span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <EventRows
                      events={group.items}
                      emptyLabel="Nenhum evento neste mês."
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

function EventRows({
  events,
  emptyLabel,
  onEdit,
  onDelete,
}: {
  events: Event[]
  emptyLabel: string
  onEdit: (event: Event) => void
  onDelete: (id: string) => void
}) {
  if (events.length === 0) return <EmptyState label={emptyLabel} />

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Local</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{formatDateBR(event.date)}</TableCell>
              <TableCell>{event.time}</TableCell>
              <TableCell className="font-medium">{event.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{event.type}</Badge>
              </TableCell>
              <TableCell>{event.location}</TableCell>
              <TableCell className="space-x-2 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(event)}
                  aria-label={`Editar ${event.title}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(event.id)}
                  aria-label={`Remover ${event.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
