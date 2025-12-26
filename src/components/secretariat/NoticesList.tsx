import { useState } from 'react'
import { Announcement, mockAnnouncements } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { NoticeDialog } from './NoticeDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { format } from 'date-fns'

export function NoticesList() {
  const [notices, setNotices] = useState<Announcement[]>(mockAnnouncements)
  const dialog = useDialog()
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(
    null,
  )

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedNotice) {
        setNotices(
          notices.map((n) =>
            n.id === selectedNotice.id ? { ...n, ...data } : n,
          ),
        )
        return 'Aviso atualizado com sucesso.'
      } else {
        const newNotice: Announcement = {
          id: String(notices.length + 1),
          date: format(new Date(), 'yyyy-MM-dd'),
          author: 'Você',
          ...data,
        }
        setNotices([newNotice, ...notices])
        return 'Aviso publicado com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o aviso.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      setNotices(notices.filter((n) => n.id !== id))
      return 'O aviso foi removido.'
    },
    {
      successMessage: 'Aviso removido com sucesso!',
      errorMessage: 'Falha ao remover o aviso.',
    },
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleDelete = (id: string) => {
    deleteOperation.execute(id)
  }

  const openEdit = (notice: Announcement) => {
    setSelectedNotice(notice)
    dialog.openDialog()
  }

  const openNew = () => {
    setSelectedNotice(null)
    dialog.openDialog()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Criar Novo Aviso
        </Button>
      </div>

      <div className="grid gap-4">
        {notices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum aviso publicado.
          </div>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Publicado em {notice.date} por {notice.author}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(notice)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(notice.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <NoticeDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        noticeToEdit={selectedNotice}
        onSave={handleSave}
      />
    </div>
  )
}
