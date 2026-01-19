import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Mail,
  Search,
  Eye,
  CheckCircle2,
  Reply,
  Archive,
  Loader2,
  Download,
  FileText,
  Tag,
  Send,
} from 'lucide-react'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { exportToCSV, exportToPDF } from '@/lib/export-utils'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  category?: string
  reply_text?: string
  replied_at?: string
  replied_by?: string
  created_at: string
  updated_at: string
}

const replySchema = z.object({
  replyText: z.string().min(10, 'A resposta deve ter pelo menos 10 caracteres'),
})

const categoryOptions = [
  { value: '', label: 'Sem categoria' },
  { value: 'duvida', label: 'Dúvida' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'reclamacao', label: 'Reclamação' },
  { value: 'elogio', label: 'Elogio' },
  { value: 'solicitacao', label: 'Solicitação' },
  { value: 'outro', label: 'Outro' },
]

export function ContactMessagesList() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  )
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const { toast } = useToast()
  const supabaseAny = supabase as any
  const hasLoadedRef = useRef(false)

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      replyText: '',
    },
  })

  const categoryForm = useForm({
    defaultValues: {
      category: '',
    },
  })

  const loadMessages = useAsyncOperation(
    async () => {
      const { data: rows, error } = await supabaseAny
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Não foi possível carregar as mensagens.')
      }

      const mappedMessages = (rows || []).map((row: any) => {
        const message: ContactMessage = {
          id: row.id,
          name: row.name,
          email: row.email,
          message: row.message,
          status: row.status || 'new',
          created_at: row.created_at,
          updated_at: row.updated_at,
        }

        // Adicionar campos opcionais apenas se existirem
        if (row.category !== undefined && row.category !== null) {
          message.category = row.category
        }
        if (row.reply_text !== undefined && row.reply_text !== null) {
          message.reply_text = row.reply_text
        }
        if (row.replied_at !== undefined && row.replied_at !== null) {
          message.replied_at = row.replied_at
        }
        if (row.replied_by !== undefined && row.replied_by !== null) {
          message.replied_by = row.replied_by
        }

        return message
      })

      setMessages(mappedMessages)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar mensagens.',
    },
  )

  const updateStatus = useAsyncOperation(
    async (messageId: string, newStatus: string) => {
      const { error } = await supabaseAny
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', messageId)

      if (error) {
        throw new Error('Falha ao atualizar status da mensagem.')
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: newStatus as any } : msg,
        ),
      )

      if (selectedMessage?.id === messageId) {
        setSelectedMessage({
          ...selectedMessage,
          status: newStatus as any,
        })
      }

      return 'Status atualizado com sucesso.'
    },
    {
      successMessage: 'Status atualizado com sucesso!',
      errorMessage: 'Falha ao atualizar status.',
    },
  )

  const sendReply = useAsyncOperation(
    async (data: z.infer<typeof replySchema>) => {
      if (!selectedMessage || !user) {
        throw new Error('Mensagem ou usuário não encontrado.')
      }

      // Enviar email via Edge Function (opcional - não bloqueia se falhar)
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000)
        })

        const invokePromise = supabase.functions.invoke('send-contact-reply', {
          body: {
            to: selectedMessage.email,
            from: 'noreply@templariosdapaz.com.br',
            subject: 'Re: Sua mensagem no site',
            replyText: data.replyText,
            originalMessage: selectedMessage.message,
          },
        })

        await Promise.race([invokePromise, timeoutPromise]).catch((err) => {
          // Silenciosamente ignora erros de Edge Function
          console.warn('Edge Function não disponível ou erro de CORS (opcional):', err)
        })
      } catch (err) {
        // Silenciosamente ignora - não é crítico
        console.warn('Edge Function não disponível:', err)
      }

      // Atualizar mensagem no banco
      // Estratégia: tentar com campos completos, depois apenas reply_text, depois apenas status
      let replySaved = false
      let updateData: any = {
        reply_text: data.replyText,
        status: 'replied',
      }

      // Tentar adicionar campos opcionais (podem não existir se migração não foi aplicada)
      try {
        updateData.replied_at = new Date().toISOString()
        updateData.replied_by = user.id
      } catch (e) {
        // Ignora se não conseguir adicionar
      }

      // Tentativa 1: Com todos os campos
      let { error } = await supabaseAny
        .from('contact_messages')
        .update(updateData)
        .eq('id', selectedMessage.id)

      // Tentativa 2: Se falhar e for erro de coluna, tenta apenas com reply_text
      if (error) {
        const isColumnError =
          error.message?.includes('column') ||
          error.message?.includes('does not exist') ||
          error.message?.includes('replied_at') ||
          error.message?.includes('replied_by') ||
          error.message?.includes('reply_text') ||
          error.code === '42703' ||
          error.code === 'PGRST116'

        if (isColumnError) {
          // Tentar apenas com reply_text
          const { error: replyTextError } = await supabaseAny
            .from('contact_messages')
            .update({
              reply_text: data.replyText,
              status: 'replied',
            })
            .eq('id', selectedMessage.id)

          if (replyTextError) {
            // Se reply_text também não existir, tentar apenas status
            const isReplyTextError =
              replyTextError.message?.includes('reply_text') ||
              replyTextError.message?.includes('column') ||
              replyTextError.code === '42703' ||
              replyTextError.code === 'PGRST116'

            if (isReplyTextError) {
              // Última tentativa: apenas atualizar status
              const { error: statusError } = await supabaseAny
                .from('contact_messages')
                .update({
                  status: 'replied',
                })
                .eq('id', selectedMessage.id)

              if (statusError) {
                throw new Error(
                  'Falha ao atualizar a mensagem. Por favor, aplique a migração "APLICAR_TODAS_MELHORIAS_CONTATO.sql" no banco de dados.',
                )
              }

              // Se conseguiu apenas atualizar status, mostrar aviso
              replySaved = false
              toast({
                variant: 'default',
                title: 'Status Atualizado',
                description:
                  'O status foi atualizado para "Respondida", mas a resposta não pôde ser salva no banco. Aplique a migração "APLICAR_TODAS_MELHORIAS_CONTATO.sql" para salvar respostas.',
              })
            } else {
              throw new Error(
                `Falha ao salvar a resposta: ${replyTextError.message || 'Erro desconhecido'}`,
              )
            }
          } else {
            replySaved = true
          }
        } else {
          throw new Error(
            `Falha ao salvar a resposta: ${error.message || 'Erro desconhecido'}`,
          )
        }
      } else {
        replySaved = true
      }

      // Atualizar estado local
      const now = new Date().toISOString()
      const updatedMessage = {
        ...selectedMessage,
        status: 'replied' as const,
      }

      if (replySaved) {
        updatedMessage.reply_text = data.replyText
        updatedMessage.replied_at = now
        updatedMessage.replied_by = user.id
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === selectedMessage.id ? updatedMessage : msg,
        ),
      )

      setSelectedMessage(updatedMessage)

      setIsReplyOpen(false)
      replyForm.reset()

      return 'Resposta enviada com sucesso!'
    },
    {
      successMessage: 'Resposta enviada com sucesso!',
      errorMessage: 'Falha ao enviar resposta.',
    },
  )

  const updateCategory = useAsyncOperation(
    async (messageId: string, category: string) => {
      const { error } = await supabaseAny
        .from('contact_messages')
        .update({ category: category || null })
        .eq('id', messageId)

      if (error) {
        throw new Error('Falha ao atualizar categoria.')
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, category: category || undefined } : msg,
        ),
      )

      if (selectedMessage?.id === messageId) {
        setSelectedMessage({
          ...selectedMessage,
          category: category || undefined,
        })
      }

      setIsCategoryOpen(false)
      categoryForm.reset()

      return 'Categoria atualizada com sucesso.'
    },
    {
      successMessage: 'Categoria atualizada!',
      errorMessage: 'Falha ao atualizar categoria.',
    },
  )

  // Filtrar mensagens
  useEffect(() => {
    let filtered = messages

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((msg) => msg.status === statusFilter)
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'none') {
        filtered = filtered.filter((msg) => !msg.category)
      } else {
        filtered = filtered.filter((msg) => msg.category === categoryFilter)
      }
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (msg) =>
          msg.name.toLowerCase().includes(term) ||
          msg.email.toLowerCase().includes(term) ||
          msg.message.toLowerCase().includes(term) ||
          (msg.category && msg.category.toLowerCase().includes(term)),
      )
    }

    setFilteredMessages(filtered)
  }, [messages, statusFilter, categoryFilter, searchTerm])

  // Carregar mensagens na montagem
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadMessages.execute()
    }
  }, [loadMessages])

  // Sincronizar formulário de categoria quando mensagem selecionada muda
  useEffect(() => {
    if (selectedMessage) {
      categoryForm.setValue('category', selectedMessage.category || '')
    }
  }, [selectedMessage, categoryForm])

  const { execute: loadMessagesExecute, loading: loadMessagesLoading } =
    loadMessages
  const { execute: updateStatusExecute, loading: updateStatusLoading } =
    updateStatus
  const { execute: sendReplyExecute, loading: sendReplyLoading } = sendReply
  const { execute: updateCategoryExecute, loading: updateCategoryLoading } =
    updateCategory

  const newCount = messages.filter((m) => m.status === 'new').length
  const readCount = messages.filter((m) => m.status === 'read').length
  const repliedCount = messages.filter((m) => m.status === 'replied').length
  const archivedCount = messages.filter((m) => m.status === 'archived').length

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      new: 'default',
      read: 'secondary',
      replied: 'secondary',
      archived: 'outline',
    }

    const labels: Record<string, string> = {
      new: 'Nova',
      read: 'Lida',
      replied: 'Respondida',
      archived: 'Arquivada',
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Sem categoria'
    const option = categoryOptions.find((opt) => opt.value === category)
    return option?.label || category
  }

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message)
    setIsDetailOpen(true)

    // Marcar como lida se ainda for nova
    if (message.status === 'new') {
      updateStatusExecute(message.id, 'read')
    }
  }

  const handleStatusChange = async (messageId: string, newStatus: string) => {
    await updateStatusExecute(messageId, newStatus)
    toast({
      title: 'Status Atualizado',
      description: 'O status da mensagem foi atualizado com sucesso.',
    })
  }

  const handleReplyEmail = (email: string) => {
    window.location.href = `mailto:${email}?subject=Re: Mensagem do Site`
  }

  const handleOpenReply = () => {
    setIsReplyOpen(true)
    replyForm.reset({
      replyText: selectedMessage?.reply_text || '',
    })
  }

  const handleOpenCategory = () => {
    setIsCategoryOpen(true)
  }

  const handleExportCSV = () => {
    try {
      exportToCSV(filteredMessages, 'mensagens-contato')
      toast({
        title: 'Exportação Concluída',
        description: 'Arquivo CSV baixado com sucesso.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro na Exportação',
        description: error.message || 'Falha ao exportar mensagens.',
      })
    }
  }

  const handleExportPDF = () => {
    try {
      exportToPDF(filteredMessages)
      toast({
        title: 'Exportação Iniciada',
        description: 'A janela de impressão será aberta.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro na Exportação',
        description: error.message || 'Falha ao exportar mensagens.',
      })
    }
  }

  const handleReplySubmit = async (data: z.infer<typeof replySchema>) => {
    await sendReplyExecute(data)
  }

  const handleCategorySubmit = async (data: { category: string }) => {
    if (!selectedMessage) return
    await updateCategoryExecute(selectedMessage.id, data.category)
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Respondidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repliedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Arquivadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou mensagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="new">Novas</SelectItem>
            <SelectItem value="read">Lidas</SelectItem>
            <SelectItem value="replied">Respondidas</SelectItem>
            <SelectItem value="archived">Arquivadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            <SelectItem value="none">Sem categoria</SelectItem>
            {categoryOptions
              .filter((opt) => opt.value)
              .map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          onClick={() => loadMessagesExecute()}
          disabled={loadMessagesLoading}
        >
          {loadMessagesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Atualizar'
          )}
        </Button>
      </div>

      {/* Tabela de Mensagens */}
      <Card>
        <CardContent className="p-0">
          {loadMessagesLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Nenhuma mensagem encontrada com os filtros aplicados.'
                  : 'Nenhuma mensagem recebida ainda.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">
                      {message.name}
                    </TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {message.message}
                    </TableCell>
                    <TableCell>
                      {message.category ? (
                        <Badge variant="outline">
                          {getCategoryLabel(message.category)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Sem categoria
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell>
                      {format(
                        new Date(message.created_at),
                        'dd/MM/yyyy HH:mm',
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMessage(message)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReplyEmail(message.email)}
                          title="Responder por email"
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
            <DialogDescription>
              Mensagem enviada através do formulário de contato do site
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nome
                  </label>
                  <p className="text-sm">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-sm">{selectedMessage.email}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Data de Envio
                </label>
                <p className="text-sm">
                  {format(
                    new Date(selectedMessage.created_at),
                    "dd/MM/yyyy 'às' HH:mm",
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Categoria
                  </label>
                  <div className="mt-1">
                    {selectedMessage.category ? (
                      <Badge variant="outline">
                        {getCategoryLabel(selectedMessage.category)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sem categoria
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Mensagem
                </label>
                <div className="mt-2 p-4 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              {selectedMessage.reply_text && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Resposta Enviada
                  </label>
                  <div className="mt-2 p-4 bg-primary/10 rounded-md border border-primary/20">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedMessage.reply_text}
                    </p>
                    {selectedMessage.replied_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Respondida em:{' '}
                        {format(
                          new Date(selectedMessage.replied_at),
                          "dd/MM/yyyy 'às' HH:mm",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleOpenReply}
                  disabled={sendReplyLoading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {selectedMessage.reply_text
                    ? 'Editar Resposta'
                    : 'Responder Diretamente'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenCategory}
                  disabled={updateCategoryLoading}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  {selectedMessage.category ? 'Alterar Categoria' : 'Adicionar Categoria'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReplyEmail(selectedMessage.email)}
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Responder por Email
                </Button>
                {selectedMessage.status !== 'read' && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleStatusChange(selectedMessage.id, 'read')
                    }
                    disabled={updateStatusLoading}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como Lida
                  </Button>
                )}
                {selectedMessage.status !== 'archived' && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleStatusChange(selectedMessage.id, 'archived')
                    }
                    disabled={updateStatusLoading}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar
                  </Button>
                )}
                {selectedMessage.status === 'archived' && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleStatusChange(selectedMessage.id, 'read')
                    }
                    disabled={updateStatusLoading}
                  >
                    Desarquivar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Resposta */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Mensagem</DialogTitle>
            <DialogDescription>
              Envie uma resposta diretamente pelo sistema. Um email será enviado
              automaticamente.
            </DialogDescription>
          </DialogHeader>
          <Form {...replyForm}>
            <form
              onSubmit={replyForm.handleSubmit(handleReplySubmit)}
              className="space-y-4"
            >
              <FormField
                control={replyForm.control}
                name="replyText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resposta</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite sua resposta aqui..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReplyOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={sendReplyLoading}>
                  {sendReplyLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Resposta
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Categoria */}
      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Categoria</DialogTitle>
            <DialogDescription>
              Organize a mensagem atribuindo uma categoria.
            </DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form
              onSubmit={categoryForm.handleSubmit(handleCategorySubmit)}
              className="space-y-4"
            >
              <FormField
                control={categoryForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCategoryLoading}>
                  {updateCategoryLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
