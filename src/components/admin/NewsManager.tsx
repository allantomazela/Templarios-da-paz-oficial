import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import useNewsStore, { NewsEvent } from '@/stores/useNewsStore'
import { Plus, Pencil, Trash2, CalendarDays, Loader2 } from 'lucide-react'
import { NewsDialog } from './NewsDialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function NewsManager() {
  const { news, fetchNews, addNews, updateNews, deleteNews, loading } =
    useNewsStore()

  const dialog = useDialog()
  const [selectedNews, setSelectedNews] = useState<NewsEvent | null>(null)

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedNews) {
        await updateNews(selectedNews.id, data)
        return 'Publicação atualizada com sucesso.'
      } else {
        await addNews(data)
        return 'Publicação criada com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a publicação.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteNews(id)
      return 'Publicação excluída com sucesso.'
    },
    {
      successMessage: 'Publicação removida com sucesso!',
      errorMessage: 'Falha ao excluir a publicação.',
    },
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta publicação?')) {
      await deleteOperation.execute(id)
    }
  }

  const openNew = () => {
    setSelectedNews(null)
    dialog.openDialog()
  }

  const openEdit = (item: NewsEvent) => {
    setSelectedNews(item)
    dialog.openDialog()
  }

  if (loading && news.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Notícias e Eventos</CardTitle>
          <CardDescription>
            Publique conteúdo para a página inicial, classificando como Notícia
            ou Evento Social.
          </CardDescription>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Publicação
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data Evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhuma publicação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="truncate max-w-[200px]">
                        {item.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.category === 'social'
                          ? 'border-purple-500 text-purple-600 bg-purple-50'
                          : 'border-blue-500 text-blue-600 bg-blue-50'
                      }
                    >
                      {item.category === 'social' ? 'Evento Social' : 'Notícia'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.eventDate ? (
                      <div className="flex items-center gap-1 text-xs">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(item.eventDate), 'dd/MM/yyyy')}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isPublished ? 'default' : 'secondary'}>
                      {item.isPublished ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <NewsDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        newsToEdit={selectedNews}
        onSave={handleSave}
      />
    </Card>
  )
}
