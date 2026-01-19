import { useEffect, useState, useRef } from 'react'
import { Announcement } from '@/lib/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'

export default function Notices() {
  const [notices, setNotices] = useState<Announcement[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('member')
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
        .select('id, full_name, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error('Não foi possível carregar o perfil do usuário.')
      }

      setUserRole(profile?.role || 'member')

      // Se for membro comum, filtrar apenas avisos públicos
      const isAdminOrEditor = ['admin', 'editor'].includes(profile?.role)
      
      // Buscar todos os avisos (filtrar no cliente para evitar problemas com sintaxe PostgREST)
      const { data: rows, error } = await supabaseAny
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Não foi possível carregar os avisos.')
      }

      // Filtrar no cliente: membros comuns veem apenas avisos públicos
      const filteredRows = (rows || []).filter((row: any) => {
        // Se for admin/editor, mostrar todos
        if (isAdminOrEditor) return true
        // Se a coluna não existir ainda, considerar todos como públicos
        if (row.is_private === undefined || row.is_private === null) return true
        // Filtrar apenas avisos públicos (is_private = false)
        return row.is_private === false
      })

      const mappedNotices = filteredRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        author: row.author_name,
        date: format(new Date(row.created_at), 'yyyy-MM-dd'),
        isPrivate: row.is_private || false,
      }))

      setNotices(mappedNotices)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar avisos.',
    },
  )

  const { execute: loadNoticesExecute, loading: loadNoticesLoading } = loadNotices
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadNoticesExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mural de Avisos</h2>
        <p className="text-muted-foreground">
          Avisos e comunicados oficiais da loja.
        </p>
      </div>

      {!['admin', 'editor'].includes(userRole) && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-600">
              <Lock className="h-4 w-4" />
              <p className="text-sm">
                Você está visualizando apenas avisos públicos. Avisos privados são 
                visíveis apenas para administradores e editores.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                    {(notice as any).isPrivate && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Privado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Publicado em{' '}
                    {format(new Date(notice.date), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}{' '}
                    por {notice.author}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
