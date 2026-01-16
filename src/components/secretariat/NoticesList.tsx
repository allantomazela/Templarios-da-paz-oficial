import { useEffect, useState, useRef } from 'react'
import { Announcement } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { NoticeDialog } from './NoticeDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'

export function NoticesList() {
  const [notices, setNotices] = useState<Announcement[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>('Você')
  const dialog = useDialog()
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(
    null,
  )
  const supabaseAny = supabase as any

  const loadNotices = useAsyncOperation(
    async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Usuário não autenticado.')
      }

      setCurrentUserId(user.id)

      const { data: profile, error: profileError } = await supabaseAny
        .from('profiles')
        .select('id, full_name')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error('Não foi possível carregar o perfil do usuário.')
      }

      setCurrentUserName(profile?.full_name || 'Você')

      const { data: rows, error } = await supabaseAny
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Não foi possível carregar os avisos.')
      }

      const mappedNotices = (rows || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        author: row.author_name,
        date: format(new Date(row.created_at), 'yyyy-MM-dd'),
      }))

      setNotices(mappedNotices)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar avisos.',
    },
  )

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedNotice) {
        const { data: updatedRow, error } = await supabaseAny
          .from('announcements')
          .update({
            title: data.title,
            content: data.content,
          })
          .eq('id', selectedNotice.id)
          .select('*')
          .single()

        if (error) {
          throw new Error('Falha ao atualizar o aviso.')
        }

        const updatedNotice: Announcement = {
          id: updatedRow.id,
          title: updatedRow.title,
          content: updatedRow.content,
          author: updatedRow.author_name,
          date: format(new Date(updatedRow.created_at), 'yyyy-MM-dd'),
        }

        setNotices((prev) =>
          prev.map((notice) =>
            notice.id === updatedNotice.id ? updatedNotice : notice,
          ),
        )
        return 'Aviso atualizado com sucesso.'
      } else {
        if (!currentUserId) {
          throw new Error('Usuário não autenticado.')
        }

        const { data: createdRow, error } = await supabaseAny
          .from('announcements')
          .insert({
            title: data.title,
            content: data.content,
            author_id: currentUserId,
            author_name: currentUserName,
          })
          .select('*')
          .single()

        if (error) {
          throw new Error('Falha ao publicar o aviso.')
        }

        const newNotice: Announcement = {
          id: createdRow.id,
          title: createdRow.title,
          content: createdRow.content,
          author: createdRow.author_name,
          date: format(new Date(createdRow.created_at), 'yyyy-MM-dd'),
        }

        setNotices((prev) => [newNotice, ...prev])
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
      const { error } = await supabaseAny
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error('Falha ao remover o aviso.')
      }

      setNotices((prev) => prev.filter((notice) => notice.id !== id))
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

  const { execute: loadNoticesExecute, loading: loadNoticesLoading } =
    loadNotices

  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadNoticesExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} disabled={loadNoticesLoading}>
          <Plus className="mr-2 h-4 w-4" /> Criar Novo Aviso
        </Button>
      </div>

      <div className="grid gap-4">
        {loadNoticesLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando avisos...
          </div>
        ) : notices.length === 0 ? (
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
