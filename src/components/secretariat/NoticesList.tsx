import { useState } from 'react'
import { Announcement, mockAnnouncements } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { NoticeDialog } from './NoticeDialog'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function NoticesList() {
  const [notices, setNotices] = useState<Announcement[]>(mockAnnouncements)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(
    null,
  )
  const { toast } = useToast()

  const handleSave = (data: any) => {
    if (selectedNotice) {
      setNotices(
        notices.map((n) =>
          n.id === selectedNotice.id ? { ...n, ...data } : n,
        ),
      )
      toast({ title: 'Sucesso', description: 'Aviso atualizado.' })
    } else {
      const newNotice: Announcement = {
        id: String(notices.length + 1),
        date: format(new Date(), 'yyyy-MM-dd'),
        author: 'Você', // Mocked user
        ...data,
      }
      setNotices([newNotice, ...notices])
      toast({ title: 'Sucesso', description: 'Aviso publicado.' })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setNotices(notices.filter((n) => n.id !== id))
    toast({ title: 'Removido', description: 'O aviso foi removido.' })
  }

  const openEdit = (notice: Announcement) => {
    setSelectedNotice(notice)
    setIsDialogOpen(true)
  }

  const openNew = () => {
    setSelectedNotice(null)
    setIsDialogOpen(true)
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
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        noticeToEdit={selectedNotice}
        onSave={handleSave}
      />
    </div>
  )
}
