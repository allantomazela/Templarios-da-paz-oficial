import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import useChancellorStore from '@/stores/useChancellorStore'
import { Download, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ChancellorReports() {
  const { sessionRecords, attendanceRecords, brothers } = useChancellorStore()
  const { toast } = useToast()

  // State for Custom Report Builder
  const [showColumns, setShowColumns] = useState({
    name: true,
    degree: true,
    presences: true,
    percentage: true,
    status: false,
    role: false,
  })
  const [degreeFilter, setDegreeFilter] = useState('all')

  const handleExport = () => {
    toast({
      title: 'Exportando...',
      description: 'O relatório personalizado está sendo gerado.',
    })
  }

  // Calculate Attendance per Brother
  const brotherStats = brothers
    .filter((b) => degreeFilter === 'all' || b.degree === degreeFilter)
    .map((brother) => {
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
      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Construtor de Relatórios Personalizados</CardTitle>
          <CardDescription>
            Selecione as colunas e filtros para gerar seu relatório.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Colunas Visíveis</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="col-name"
                    checked={showColumns.name}
                    onCheckedChange={(c) =>
                      setShowColumns((p) => ({ ...p, name: !!c }))
                    }
                  />
                  <Label htmlFor="col-name">Nome do Irmão</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="col-degree"
                    checked={showColumns.degree}
                    onCheckedChange={(c) =>
                      setShowColumns((p) => ({ ...p, degree: !!c }))
                    }
                  />
                  <Label htmlFor="col-degree">Grau</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="col-presences"
                    checked={showColumns.presences}
                    onCheckedChange={(c) =>
                      setShowColumns((p) => ({ ...p, presences: !!c }))
                    }
                  />
                  <Label htmlFor="col-presences">Nº Presenças</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="col-percentage"
                    checked={showColumns.percentage}
                    onCheckedChange={(c) =>
                      setShowColumns((p) => ({ ...p, percentage: !!c }))
                    }
                  />
                  <Label htmlFor="col-percentage">% Frequência</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="col-status"
                    checked={showColumns.status}
                    onCheckedChange={(c) =>
                      setShowColumns((p) => ({ ...p, status: !!c }))
                    }
                  />
                  <Label htmlFor="col-status">Status (Ativo)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="col-role"
                    checked={showColumns.role}
                    onCheckedChange={(c) =>
                      setShowColumns((p) => ({ ...p, role: !!c }))
                    }
                  />
                  <Label htmlFor="col-role">Cargo</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Filtros Avançados</Label>
              <div className="space-y-2">
                <Label>Filtrar por Grau</Label>
                <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Graus</SelectItem>
                    <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                    <SelectItem value="Companheiro">Companheiro</SelectItem>
                    <SelectItem value="Mestre">Mestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Aplicar Filtros
            </Button>
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" /> Exportar CSV/PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {showColumns.name && <TableHead>Irmão</TableHead>}
                  {showColumns.degree && <TableHead>Grau</TableHead>}
                  {showColumns.role && <TableHead>Cargo</TableHead>}
                  {showColumns.status && <TableHead>Status</TableHead>}
                  {showColumns.presences && (
                    <TableHead className="text-center">
                      Presenças / Total
                    </TableHead>
                  )}
                  {showColumns.percentage && (
                    <TableHead className="text-right">% Frequência</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {brotherStats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        Object.values(showColumns).filter(Boolean).length
                      }
                      className="text-center py-8"
                    >
                      Nenhum dado encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  brotherStats.map((brother) => (
                    <TableRow key={brother.id}>
                      {showColumns.name && (
                        <TableCell className="font-medium">
                          {brother.name}
                        </TableCell>
                      )}
                      {showColumns.degree && (
                        <TableCell>{brother.degree}</TableCell>
                      )}
                      {showColumns.role && (
                        <TableCell>{brother.role}</TableCell>
                      )}
                      {showColumns.status && (
                        <TableCell>{brother.status}</TableCell>
                      )}
                      {showColumns.presences && (
                        <TableCell className="text-center">
                          {brother.presences} /{' '}
                          {
                            sessionRecords.filter(
                              (s) => s.status === 'Finalizada',
                            ).length
                          }
                        </TableCell>
                      )}
                      {showColumns.percentage && (
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
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
