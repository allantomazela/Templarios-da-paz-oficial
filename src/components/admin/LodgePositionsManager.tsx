import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  useLodgePositionsStore,
  POSITION_LABELS,
  type LodgePositionType,
  type LodgePosition,
} from '@/stores/useLodgePositionsStore'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useDialog } from '@/hooks/use-dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import {
  Crown,
  Calendar,
  User,
  Edit,
  Trash2,
  Plus,
  History,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const positionFormSchema = z.object({
  position_type: z.enum([
    'veneravel_mestre',
    'orador',
    'secretario',
    'chanceler',
    'tesoureiro',
    'mestre_banquete',
  ]),
  user_id: z.string().min(1, 'Selecione um usuário'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de término é obrigatória'),
})

type PositionFormValues = z.infer<typeof positionFormSchema>

interface User {
  id: string
  full_name: string
  email: string
}

export function LodgePositionsManager() {
  const { toast } = useToast()
  const {
    positions,
    history,
    loading,
    fetchPositions,
    fetchHistory,
    assignPosition,
    removePosition,
  } = useLodgePositionsStore()
  const dialog = useDialog()
  const [users, setUsers] = useState<User[]>([])
  const [positionToEdit, setPositionToEdit] = useState<LodgePosition | null>(
    null,
  )
  const [showHistory, setShowHistory] = useState(false)

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      position_type: 'veneravel_mestre',
      user_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addYears(new Date(), 2), 'yyyy-MM-dd'),
    },
  })

  // Carregar usuários aprovados
  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('status', 'approved')
        .order('full_name')

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      setUsers(data || [])
    }

    loadUsers()
  }, [])

  // Carregar cargos ao montar
  useEffect(() => {
    fetchPositions()
    fetchHistory()
  }, [fetchPositions, fetchHistory])

  const assignOperation = useAsyncOperation({
    operation: async (data: PositionFormValues) => {
      await assignPosition(
        data.position_type,
        data.user_id,
        data.start_date,
        data.end_date,
      )
    },
    onSuccess: () => {
      toast({
        title: 'Cargo Atribuído',
        description: 'O cargo foi atribuído com sucesso.',
      })
      dialog.closeDialog()
      form.reset()
      setPositionToEdit(null)
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error?.message || 'Não foi possível atribuir o cargo.',
      })
    },
  })

  const deleteOperation = useAsyncOperation({
    operation: async (positionId: string) => {
      await removePosition(positionId)
    },
    onSuccess: () => {
      toast({
        title: 'Cargo Removido',
        description: 'O cargo foi removido com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error?.message || 'Não foi possível remover o cargo.',
      })
    },
  })

  const handleOpenDialog = (position?: LodgePosition) => {
    if (position) {
      setPositionToEdit(position)
      form.reset({
        position_type: position.position_type,
        user_id: position.user_id || '',
        start_date: position.start_date,
        end_date: position.end_date,
      })
    } else {
      setPositionToEdit(null)
      form.reset({
        position_type: 'veneravel_mestre',
        user_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addYears(new Date(), 2), 'yyyy-MM-dd'),
      })
    }
    dialog.openDialog()
  }

  const handleSubmit = (data: PositionFormValues) => {
    assignOperation.execute(data)
  }

  const handleDelete = (positionId: string) => {
    if (
      window.confirm(
        'Tem certeza que deseja remover este cargo? O cargo será movido para o histórico.',
      )
    ) {
      deleteOperation.execute(positionId)
    }
  }

  const getCurrentUser = (userId: string | null) => {
    if (!userId) return null
    return users.find((u) => u.id === userId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Cargos Maçônicos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os cargos da diretoria da loja (mandato de 2 anos).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="mr-2 h-4 w-4" />
            {showHistory ? 'Cargos Atuais' : 'Histórico'}
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Atribuir Cargo
          </Button>
        </div>
      </div>

      <Alert>
        <Crown className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Os cargos têm validade de 2 anos. Ao
          atribuir um novo cargo, o cargo anterior será automaticamente movido
          para o histórico. O Venerável Mestre tem acesso total ao sistema.
        </AlertDescription>
      </Alert>

      {showHistory ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Cargos</CardTitle>
            <CardDescription>
              Registro de todos os cargos ocupados anteriormente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum histórico disponível.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Período</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => {
                    const user = getCurrentUser(item.user_id)
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {POSITION_LABELS[item.position_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user ? (
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Usuário removido
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(item.start_date), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}{' '}
                            -{' '}
                            {format(new Date(item.end_date), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Cargos Atuais</CardTitle>
            <CardDescription>
              Cargos ativos da diretoria da loja no momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Carregando...
              </p>
            ) : positions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum cargo atribuído. Clique em "Atribuir Cargo" para começar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => {
                    const user = getCurrentUser(position.user_id)
                    return (
                      <TableRow key={position.id}>
                        <TableCell>
                          <Badge
                            variant={
                              position.position_type === 'veneravel_mestre'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {POSITION_LABELS[position.position_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user ? (
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Nenhum usuário atribuído
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(position.start_date), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}{' '}
                            -{' '}
                            {format(new Date(position.end_date), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(position)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(position.id)}
                              disabled={deleteOperation.loading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialog.open} onOpenChange={dialog.onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {positionToEdit ? 'Editar Cargo' : 'Atribuir Novo Cargo'}
            </DialogTitle>
            <DialogDescription>
              {positionToEdit
                ? 'Atualize as informações do cargo.'
                : 'Selecione o cargo e o usuário que ocupará esta posição.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="position_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!positionToEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(POSITION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O cargo determina as permissões de acesso aos módulos do
                      sistema.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o usuário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Término</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={dialog.closeDialog}
                  disabled={assignOperation.loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={assignOperation.loading}>
                  {assignOperation.loading
                    ? 'Salvando...'
                    : positionToEdit
                      ? 'Atualizar'
                      : 'Atribuir'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

