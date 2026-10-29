import { forwardRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatDateBR } from '@/lib/format-utils'
import type { SessionSpeechRow } from '@/lib/session-speech-list'

type SessionSpeechSheetProps = {
  periodLabel: string
  rows: SessionSpeechRow[]
}

export const SessionSpeechSheet = forwardRef<HTMLDivElement, SessionSpeechSheetProps>(
  function SessionSpeechSheet({ periodLabel, rows }, ref) {
    return (
      <div
        ref={ref}
        className="mx-auto w-full max-w-[210mm] bg-white p-4 text-black shadow-sm sm:p-8"
      >
        <ReportHeader
          title="Falas da sessão"
          subtitle={periodLabel}
          description="Lista para o Chanceler mencionar em loja."
        />
        {rows.length === 0 ? (
          <p className="text-sm text-gray-600">
            Nenhuma fala neste período com os filtros marcados.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-black">Data</TableHead>
                <TableHead className="text-black">Fala</TableHead>
                <TableHead className="text-black">Nome</TableHead>
                <TableHead className="text-black">Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">{formatDateBR(row.date)}</TableCell>
                  <TableCell>{row.speech}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.link}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    )
  },
)
