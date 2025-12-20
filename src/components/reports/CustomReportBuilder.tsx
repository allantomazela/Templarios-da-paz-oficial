import { useState, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import useChancellorStore from '@/stores/useChancellorStore'
import useReportStore, { ReportTemplate } from '@/stores/useReportStore'
import { Download, Save } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { ReportHeader } from './ReportHeader'

export function CustomReportBuilder() {
  const { sessionRecords, attendanceRecords, brothers } = useChancellorStore()
  const { templates, addTemplate, addHistory } = useReportStore()
  const { toast } = useToast()
  const reportRef = useRef<HTMLDivElement>(null)

  const [showColumns, setShowColumns] = useState({
    name: true,
    degree: true,
    presences: true,
    percentage: true,
    status: false,
    role: false,
  })
  const [degreeFilter, setDegreeFilter] = useState('all')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Relatorio_Presenca_${format(new Date(), 'yyyy-MM-dd')}`,
    onAfterPrint: () => {
      addHistory({
        id: crypto.randomUUID(),
        title: 'Relatório Personalizado de Presença',
        date: new Date().toISOString(),
        templateName: selectedTemplateId
          ? templates.find((t) => t.id === selectedTemplateId)?.name ||
            'Personalizado'
          : 'Personalizado',
        type: 'Personalizado',
      })
      toast({
        title: 'Relatório Gerado',
        description: 'O relatório foi enviado para impressão/PDF.',
      })
    },
  })

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

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setShowColumns(template.columns)
      setDegreeFilter(template.filterDegree)
      setSelectedTemplateId(templateId)
      toast({
        title: 'Modelo Carregado',
        description: `O modelo "${template.name}" foi aplicado.`,
      })
    }
  }

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o modelo.',
        variant: 'destructive',
      })
      return
    }

    const newTemplate: ReportTemplate = {
      id: crypto.randomUUID(),
      name: newTemplateName,
      columns: showColumns,
      filterDegree: degreeFilter,
    }

    addTemplate(newTemplate)
    setIsSaveDialogOpen(false)
    setNewTemplateName('')
    setSelectedTemplateId(newTemplate.id)
    toast({
      title: 'Modelo Salvo',
      description: 'As configurações foram salvas como um novo modelo.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center no-print">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Configuração do Relatório</h3>
          <p className="text-sm text-muted-foreground">
            Personalize colunas e filtros para exportação.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTemplateId} onValueChange={handleLoadTemplate}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Carregar Modelo..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Salvar Modelo">
                <Save className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Modelo de Relatório</DialogTitle>
                <DialogDescription>
                  Dê um nome para este conjunto de configurações para usá-lo
                  novamente no futuro.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="template-name" className="mb-2 block">
                  Nome do Modelo
                </Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Ex: Relatório Mensal de Mestres"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsSaveDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveTemplate}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label htmlFor="col-status">Status</Label>
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
              <Label className="text-base font-medium">Filtros</Label>
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

          <div className="flex justify-end mt-6">
            <Button onClick={() => handlePrint()} className="gap-2">
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Printable Area */}
      <div
        className="border rounded-md bg-white text-black p-8"
        ref={reportRef}
      >
        <ReportHeader
          title="Relatório de Frequência"
          description="Estatísticas de presença dos irmãos da loja"
        />

        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-black">
              {showColumns.name && (
                <TableHead className="text-black font-bold">Irmão</TableHead>
              )}
              {showColumns.degree && (
                <TableHead className="text-black font-bold">Grau</TableHead>
              )}
              {showColumns.role && (
                <TableHead className="text-black font-bold">Cargo</TableHead>
              )}
              {showColumns.status && (
                <TableHead className="text-black font-bold">Status</TableHead>
              )}
              {showColumns.presences && (
                <TableHead className="text-center text-black font-bold">
                  Presenças
                </TableHead>
              )}
              {showColumns.percentage && (
                <TableHead className="text-right text-black font-bold">
                  % Freq.
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brotherStats.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Nenhum dado encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              brotherStats.map((brother) => (
                <TableRow key={brother.id} className="border-b border-gray-200">
                  {showColumns.name && (
                    <TableCell className="font-medium text-black">
                      {brother.name}
                    </TableCell>
                  )}
                  {showColumns.degree && (
                    <TableCell className="text-black">
                      {brother.degree}
                    </TableCell>
                  )}
                  {showColumns.role && (
                    <TableCell className="text-black">{brother.role}</TableCell>
                  )}
                  {showColumns.status && (
                    <TableCell className="text-black">
                      {brother.status}
                    </TableCell>
                  )}
                  {showColumns.presences && (
                    <TableCell className="text-center text-black">
                      {brother.presences}
                    </TableCell>
                  )}
                  {showColumns.percentage && (
                    <TableCell className="text-right">
                      <span
                        className={`font-bold ${
                          brother.percentage < 50
                            ? 'text-red-600'
                            : brother.percentage < 75
                              ? 'text-amber-600'
                              : 'text-green-600'
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

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-400">
          <p>Documento gerado eletronicamente pelo sistema Templários da Paz</p>
        </div>
      </div>
    </div>
  )
}
