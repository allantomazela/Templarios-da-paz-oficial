import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import useImageOptimizationStore from '@/stores/useImageOptimizationStore'
import {
  Play,
  RotateCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImageOptimizer() {
  const {
    tasks,
    scanning,
    processing,
    progress,
    scanImages,
    processAll,
    reset,
  } = useImageOptimizationStore()

  const pendingCount = tasks.filter((t) => t.status === 'pending').length
  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const errorCount = tasks.filter((t) => t.status === 'error').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Concluído</Badge>
      case 'processing':
        return <Badge className="bg-blue-600 animate-pulse">Processando</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Otimização de Imagens em Massa</CardTitle>
          <CardDescription>
            Identifique e otimize todas as imagens do sistema para melhorar a
            performance. Este processo baixa, comprime e reenvia as imagens
            usando o Edge Function.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button
              onClick={scanImages}
              disabled={scanning || processing}
              variant="outline"
            >
              {scanning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="mr-2 h-4 w-4" />
              )}
              {tasks.length > 0 ? 'Re-escanear Imagens' : 'Escanear Imagens'}
            </Button>
            {tasks.length > 0 && (
              <Button
                onClick={processAll}
                disabled={processing || pendingCount === 0}
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Otimizar {pendingCount} Imagens
              </Button>
            )}
          </div>

          {processing && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/20 p-4 rounded border text-center">
              <span className="text-2xl font-bold">{tasks.length}</span>
              <p className="text-xs text-muted-foreground">Total Encontrado</p>
            </div>
            <div className="bg-green-500/10 p-4 rounded border border-green-500/20 text-center">
              <span className="text-2xl font-bold text-green-600">
                {completedCount}
              </span>
              <p className="text-xs text-muted-foreground">Otimizadas</p>
            </div>
            <div className="bg-red-500/10 p-4 rounded border border-red-500/20 text-center">
              <span className="text-2xl font-bold text-red-600">
                {errorCount}
              </span>
              <p className="text-xs text-muted-foreground">Falhas</p>
            </div>
          </div>

          {tasks.length > 0 && (
            <div className="border rounded-md">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origem</TableHead>
                      <TableHead>Campo</TableHead>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium capitalize">
                          {task.tableName.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {task.columnName}
                        </TableCell>
                        <TableCell>
                          <a
                            href={task.currentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-blue-500 hover:underline text-xs"
                          >
                            <ImageIcon className="h-3 w-3" /> Ver Imagem
                          </a>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell className="text-xs text-red-500 max-w-[200px] truncate">
                          {task.error}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
