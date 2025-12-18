import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import useReportStore from '@/stores/useReportStore'
import { FileText, Download, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ReportHistory() {
  const { history, clearHistory } = useReportStore()
  const { toast } = useToast()

  const handleReDownload = (title: string) => {
    toast({
      title: 'Regenerando Relatório',
      description: `O relatório "${title}" está sendo processado para download.`,
    })
    // In a real app, this would trigger the generation logic again using stored parameters
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleClear = () => {
    clearHistory()
    toast({
      title: 'Histórico Limpo',
      description: 'Todos os registros de relatórios foram removidos.',
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Histórico de Relatórios</CardTitle>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="mr-2 h-4 w-4" /> Limpar Histórico
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título do Relatório</TableHead>
              <TableHead>Data de Geração</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Modelo Usado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                    <p>Nenhum relatório gerado recentemente.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              history.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.title}</TableCell>
                  <TableCell>
                    {format(new Date(log.date), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.type === 'GOB' ? 'default' : 'secondary'}
                    >
                      {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.templateName}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReDownload(log.title)}
                    >
                      <Download className="mr-2 h-4 w-4" /> Baixar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
