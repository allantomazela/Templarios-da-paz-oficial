import { useState, useMemo, memo, useRef, useEffect } from 'react'
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
import { useReactToPrint } from 'react-to-print'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { format } from 'date-fns'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'

export const ChancellorReports = memo(function ChancellorReports() {
  const { sessionRecords, attendanceRecords, brothers } = useChancellorStore()
  const { toast } = useToast()
  const reportRef = useRef<HTMLDivElement>(null)
  const { positions, fetchPositions } = useLodgePositionsStore()

  // Buscar cargos ao montar o componente
  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  // Obter nomes do Venerável Mestre e Chanceler
  const venerableMaster = positions.find(
    (p) => p.position_type === 'veneravel_mestre'
  )?.user?.full_name || 'Venerável Mestre'

  const chancellor = positions.find(
    (p) => p.position_type === 'chanceler'
  )?.user?.full_name || 'Chanceler'

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

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Relatorio_Chanceler_Frequencia_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onAfterPrint: () => {
      toast({
        title: 'Relatório Gerado',
        description: 'O relatório foi enviado para impressão/PDF. Use "Salvar como PDF" na janela de impressão para salvar o arquivo.',
      })
    },
    onPrintError: (error) => {
      toast({
        title: 'Erro ao Gerar PDF',
        description: 'Não foi possível gerar o PDF. Tente novamente.',
        variant: 'destructive',
      })
      console.error('Erro ao imprimir:', error)
    },
  })

  const handleExport = () => {
    const csv = [
      [
        'Irmão',
        'Grau',
        'Cargo',
        'Status',
        'Presenças',
        'Total Sessões',
        '% Frequência',
      ].join(','),
      ...brotherStats.map((b) =>
        [
          b.name,
          b.degree,
          b.role || '',
          b.status || '',
          b.presences.toString(),
          sessionRecords.filter((s) => s.status === 'Finalizada').length.toString(),
          b.percentage.toString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-frequencia-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()

    toast({
      title: 'CSV Exportado',
      description: 'O relatório foi exportado em formato CSV.',
    })
  }

  // Calculate Attendance per Brother
  const brotherStats = useMemo(() => {
    return brothers
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
  }, [brothers, degreeFilter, sessionRecords, attendanceRecords])

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
            {brotherStats.length > 0 && (
              <>
                <Button onClick={handlePrint} className="gap-2" title="Imprimir ou salvar como PDF">
                  <Download className="h-4 w-4" />
                  Imprimir / Salvar PDF
                </Button>
                <Button onClick={handleExport} variant="outline" className="gap-2" title="Exportar dados em formato CSV">
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Table - não aparece na impressão */}
      <Card className="no-print">
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

      {/* Relatório formatado para impressão/PDF - sempre renderizado */}
      {brotherStats.length > 0 && (
        <div
          id="chancellor-report-container"
          className="border rounded-md bg-white text-black p-8 print:p-0 hidden print:block"
          ref={reportRef}
        >
          <ReportHeader
            title="Relatório de Frequência"
            subtitle="Chancelaria"
            description="Relatório detalhado de presença e frequência dos irmãos da loja"
          />

          {/* Informações do Relatório */}
          <div className="mb-2 print:mb-1.5 pb-2 print:pb-1 border-b border-gray-400 print:border-black">
            <div className="grid grid-cols-2 gap-x-6 print:gap-x-4 gap-y-1 print:gap-y-0.5">
              <div>
                <span className="text-[10px] print:text-[9px] font-bold text-gray-600 print:text-black uppercase block">
                  Filtro por Grau
                </span>
                <span className="text-sm print:text-xs font-semibold text-black">
                  {degreeFilter === 'all' ? 'Todos os Graus' : degreeFilter}
                </span>
              </div>
              <div>
                <span className="text-[10px] print:text-[9px] font-bold text-gray-600 print:text-black uppercase block">
                  Total de Irmãos
                </span>
                <span className="text-sm print:text-xs font-semibold text-black">
                  {brotherStats.length}
                </span>
              </div>
              <div>
                <span className="text-[10px] print:text-[9px] font-bold text-gray-600 print:text-black uppercase block">
                  Total de Sessões
                </span>
                <span className="text-sm print:text-xs font-semibold text-black">
                  {sessionRecords.filter((s) => s.status === 'Finalizada').length}
                </span>
              </div>
              <div>
                <span className="text-[10px] print:text-[9px] font-bold text-gray-600 print:text-black uppercase block">
                  Data do Relatório
                </span>
                <span className="text-sm print:text-xs font-semibold text-black">
                  {format(new Date(), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Frequência */}
          <div className="mt-2 print:mt-1.5">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-black">
                  {showColumns.name && (
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5">
                      Irmão
                    </TableHead>
                  )}
                  {showColumns.degree && (
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5 text-center">
                      Grau
                    </TableHead>
                  )}
                  {showColumns.role && (
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5">
                      Cargo
                    </TableHead>
                  )}
                  {showColumns.status && (
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5 text-center">
                      Status
                    </TableHead>
                  )}
                  {showColumns.presences && (
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5 text-center">
                      Presenças
                    </TableHead>
                  )}
                  {showColumns.percentage && (
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5 text-right">
                      % Frequência
                    </TableHead>
                  )}
                  <TableHead className="text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5 text-center w-[180px] print:w-[150px]">
                    Assinatura
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brotherStats.map((brother) => (
                  <TableRow
                    key={brother.id}
                    className="border-b border-gray-300 print:border-gray-400"
                  >
                    {showColumns.name && (
                      <TableCell className="text-xs print:text-[10px] text-black font-medium py-1 print:py-0.5">
                        {brother.name}
                      </TableCell>
                    )}
                    {showColumns.degree && (
                      <TableCell className="text-xs print:text-[10px] text-black text-center py-1 print:py-0.5">
                        {brother.degree}
                      </TableCell>
                    )}
                    {showColumns.role && (
                      <TableCell className="text-xs print:text-[10px] text-black py-1 print:py-0.5">
                        {brother.role || '-'}
                      </TableCell>
                    )}
                    {showColumns.status && (
                      <TableCell className="text-xs print:text-[10px] text-black text-center py-1 print:py-0.5">
                        {brother.status || '-'}
                      </TableCell>
                    )}
                    {showColumns.presences && (
                      <TableCell className="text-xs print:text-[10px] text-black text-center py-1 print:py-0.5">
                        {brother.presences} /{' '}
                        {sessionRecords.filter((s) => s.status === 'Finalizada').length}
                      </TableCell>
                    )}
                    {showColumns.percentage && (
                      <TableCell className="text-xs print:text-[10px] text-black text-right font-medium py-1 print:py-0.5">
                        {brother.percentage}%
                      </TableCell>
                    )}
                    <TableCell className="py-1.5 print:py-1">
                      <div className="border-b-2 border-dotted border-gray-600 print:border-black h-12 print:h-10 w-full flex flex-col justify-end">
                        <span className="text-[9px] print:text-[8px] text-gray-500 print:text-black mb-1 print:mb-0.5 leading-tight block">
                          {brother.name}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Assinaturas do Venerável Mestre e Chanceler */}
          <div className="mt-10 print:mt-6 grid grid-cols-2 gap-12 print:gap-8 page-break-inside-avoid">
            <div className="text-center">
              <div className="border-t-2 border-black pt-3 print:pt-2 mt-20 print:mt-16 min-h-[60px] print:min-h-[50px]">
                <p className="text-sm print:text-xs font-bold text-black mb-1 print:mb-0.5">
                  {venerableMaster}
                </p>
                <p className="text-xs print:text-[10px] text-black font-semibold uppercase">
                  Venerável Mestre
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-black pt-3 print:pt-2 mt-20 print:mt-16 min-h-[60px] print:min-h-[50px]">
                <p className="text-sm print:text-xs font-bold text-black mb-1 print:mb-0.5">
                  {chancellor}
                </p>
                <p className="text-xs print:text-[10px] text-black font-semibold uppercase">
                  Chanceler
                </p>
              </div>
            </div>
          </div>

          {/* Rodapé do documento */}
          <div className="mt-4 print:mt-3 pt-2 print:pt-1 border-t text-center text-[10px] print:text-[9px] text-gray-400">
            <p>Documento gerado eletronicamente pelo sistema Templários da Paz</p>
          </div>
        </div>
      )}
    </div>
  )
})
