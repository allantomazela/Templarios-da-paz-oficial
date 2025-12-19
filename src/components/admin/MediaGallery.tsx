import { useEffect, useState } from 'react'
import { Card, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import useMediaStore, { MediaFile } from '@/stores/useMediaStore'
import {
  Search,
  Trash2,
  File as FileIcon,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function MediaGallery() {
  const { files, fetchFiles, deleteFile, loading } = useMediaStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const confirmDelete = async () => {
    if (!fileToDelete) return
    try {
      await deleteFile(fileToDelete.name)
      toast({
        title: 'Arquivo Removido',
        description: 'O arquivo foi excluído com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir o arquivo.',
      })
    } finally {
      setFileToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar arquivos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredFiles.length} arquivos
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="overflow-hidden group">
            <div className="aspect-square bg-muted/20 relative flex items-center justify-center border-b">
              {file.type.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <FileIcon className="h-16 w-16 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => setFileToDelete(file)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 text-xs">
              <p className="font-medium truncate mb-1" title={file.name}>
                {file.name}
              </p>
              <div className="flex justify-between text-muted-foreground">
                <span>{formatSize(file.size)}</span>
                <span>{format(new Date(file.created_at), 'dd/MM/yy')}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhum arquivo encontrado.
        </div>
      )}

      <Dialog
        open={!!fileToDelete}
        onOpenChange={(o) => !o && setFileToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Arquivo?</DialogTitle>
            <CardDescription>
              Esta ação não pode ser desfeita. O arquivo "{fileToDelete?.name}"
              será permanentemente removido.
            </CardDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
