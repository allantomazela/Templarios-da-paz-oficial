import { Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Brother } from '@/lib/data'
import { MEMBERSHIP_SITUATION_LABELS } from '@/lib/brother-membership-situation'
import { formatDateBR } from '@/lib/format-utils'
import { degreeSituationLabel } from '@/lib/degree-roster'

type DegreeRosterTableProps = {
  brothers: Brother[]
  emptyLabel: string
  onEdit: (brother: Brother) => void
}

export function DegreeRosterTable({ brothers, emptyLabel, onEdit }: DegreeRosterTableProps) {
  if (brothers.length === 0) {
    return <p className="rounded-md border bg-card px-3 py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Irmão</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Grau atual</TableHead>
            <TableHead>Iniciação</TableHead>
            <TableHead>Elevação</TableHead>
            <TableHead>Exaltação</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brothers.map((brother) => {
            const situation = degreeSituationLabel(brother)
            return (
              <TableRow key={brother.id}>
                <TableCell className="font-medium">{brother.name}</TableCell>
                <TableCell>
                  {situation === 'regular' ? (
                    'Regular'
                  ) : (
                    <Badge variant="secondary">{MEMBERSHIP_SITUATION_LABELS[situation]}</Badge>
                  )}
                </TableCell>
                <TableCell>{brother.degree}</TableCell>
                <TableCell>{formatDegreeDate(brother.initiationDate)}</TableCell>
                <TableCell>{formatDegreeDate(brother.elevationDate)}</TableCell>
                <TableCell>{formatDegreeDate(brother.exaltationDate)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(brother)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function formatDegreeDate(dateStr?: string) {
  return dateStr ? formatDateBR(dateStr) || '-' : '-'
}
