import type { ReactNode } from 'react'
import { ChevronDown, CalendarIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { formatDateBR } from '@/lib/format-utils'
import type {
  AttendanceListItem,
  AttendanceMonthGroup,
  SessionDisplayStatus,
} from '@/lib/attendance-presence-list'

export type AttendanceRowRenderers = {
  renderStatus: (status: SessionDisplayStatus) => ReactNode
  renderActions: (item: AttendanceListItem, fullWidth?: boolean) => ReactNode
}

export function MonthGroup({
  group,
  defaultOpen,
  renderStatus,
  renderActions,
}: {
  group: AttendanceMonthGroup
  defaultOpen: boolean
} & AttendanceRowRenderers) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm font-medium hover:bg-accent data-[state=open]:[&_svg]:rotate-180">
        <span>
          {group.label}
          <span className="ml-2 text-muted-foreground">({group.items.length})</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <PresenceRows
          items={group.items}
          emptyLabel="Nenhuma sessão neste mês."
          renderStatus={renderStatus}
          renderActions={renderActions}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}

export function PresenceRows({
  items,
  emptyLabel,
  renderStatus,
  renderActions,
}: {
  items: AttendanceListItem[]
  emptyLabel: string
} & AttendanceRowRenderers) {
  if (items.length === 0) return <EmptyState label={emptyLabel} />

  return (
    <>
      <div className="hidden overflow-x-auto rounded-md border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.event.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {formatDateBR(item.event.date) || '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {eventSubtitle(item)}
                  </div>
                </TableCell>
                <TableCell>{renderStatus(item.displayStatus)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">{renderActions(item)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <Card key={item.event.id} className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium leading-tight">{item.event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{eventSubtitle(item)}</p>
                </div>
                {renderStatus(item.displayStatus)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                {formatDateBR(item.event.date) || '—'}
              </div>
              {renderActions(item, true)}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

function eventSubtitle(item: AttendanceListItem): string {
  return item.event.degree
    ? `${item.event.type} · ${item.event.degree}`
    : item.event.type
}
