import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useChancellorStore from '@/stores/useChancellorStore'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ChancellorReports() {
  const { sessionRecords, attendanceRecords, brothers } = useChancellorStore()
  const { toast } = useToast()

  const handleExport = () => {
    toast({
      title: 'Exportando...',
      description: 'O relatório de frequência está sendo gerado.',
    })
  }

  // Calculate Attendance per Brother
  const brotherStats = brothers.map((brother) => {
    // Total sessions that occurred
    const totalSessions = sessionRecords.filter(
      (s) => s.status === 'Finalizada',
    ).length

    if (totalSessions === 0) {
      return { ...brother, presences: 0, percentage: 0 }
    }

    const presences = attendanceRecords.filter(
      (ar) =>
        ar.brotherId === brother.id &&
        (ar.status === 'Presente' || ar.status === 'Justificado'),
    ).length

    const percentage = Math.round((presences / totalSessions) * 100)

    return {
      ...brother,
      presences,
      percentage,
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Relatório Geral de Frequência</CardTitle>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Irmão</TableHead>
                <TableHead>Grau</TableHead>
                <TableHead className="text-center">Presenças / Total</TableHead>
                <TableHead className="text-right">% Frequência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brotherStats.map((brother) => (
                <TableRow key={brother.id}>
                  <TableCell className="font-medium">{brother.name}</TableCell>
                  <TableCell>{brother.degree}</TableCell>
                  <TableCell className="text-center">
                    {brother.presences} /{' '}
                    {
                      sessionRecords.filter((s) => s.status === 'Finalizada')
                        .length
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-bold ${
                        brother.percentage < 50
                          ? 'text-red-500'
                          : brother.percentage < 75
                            ? 'text-amber-500'
                            : 'text-green-500'
                      }`}
                    >
                      {brother.percentage}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
