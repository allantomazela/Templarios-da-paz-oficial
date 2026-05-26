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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import useUserStore from '@/stores/useUserStore'
import useAuthStore from '@/stores/useAuthStore'
import { deleteUserAsAdmin } from '@/lib/admin-user-api'
import { isMasterAdminEmail } from '@/config/master-admin'
import { UserEditDialog } from '@/components/admin/UserEditDialog'
import {
  MoreHorizontal,
  Search,
  Shield,
  CheckCircle,
  Ban,
  Loader2,
  Mail,
  Flower2,
  Moon,
  UserX,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Profile } from '@/stores/useAuthStore'
import { useCanApproveUsers } from '@/hooks/use-can-approve-users'
import { sendUserEmail } from '@/lib/user-email-api'

function roleLabel(role: Profile['role']) {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'editor':
      return 'Editor'
    default:
      return 'Membro'
  }
}

function degreeLabel(degree?: string) {
  return degree || 'Aprendiz'
}

export function UserManagement() {
  const {
    users,
    fetchUsers,
    updateUserStatus,
    updateUserProfile,
    removeUserFromList,
    loading,
  } = useUserStore()
  const { user: currentUser } = useAuthStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isSystemAdmin =
    currentUser?.role === 'admin' || isMasterAdminEmail(currentUser?.email)
  const canApproveUsers = useCanApproveUsers()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.full_name?.toLowerCase() || '').includes(
        searchTerm.toLowerCase(),
      ) || (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const canDeleteUser = (user: Profile) => {
    if (!isSystemAdmin) return false
    if (user.id === currentUser?.id) return false
    if (isMasterAdminEmail(user.email)) return false
    return true
  }

  const handleStatusChange = async (
    user: Profile,
    newStatus: Profile['status'],
  ) => {
    if (!canApproveUsers) return
    try {
      await updateUserStatus(user.id, newStatus)
      if (newStatus === 'approved' && user.email) {
        const mail = await sendUserEmail({
          type: 'account_approved',
          email: user.email,
          fullName: user.full_name || 'Irmão',
        })
        if (!mail.ok && !mail.skipped) {
          toast({
            variant: 'destructive',
            title: 'Aprovado, mas e-mail falhou',
            description:
              mail.error ||
              'O usuário foi aprovado, porém o e-mail de liberação não foi enviado.',
          })
        }
      }
      toast({
        title: 'Status Atualizado',
        description: `O status de ${user.full_name} foi alterado para ${newStatus}.`,
      })
      fetchUsers()
    } catch (error: unknown) {
      const err = error as { message?: string; details?: string; hint?: string }
      const errorMessage = err?.message || 'Não foi possível atualizar o status.'
      const errorDetails = err?.details || err?.hint || ''

      toast({
        variant: 'destructive',
        title: 'Erro ao Atualizar Status',
        description: errorDetails
          ? `${errorMessage} (${errorDetails})`
          : errorMessage,
      })
    }
  }

  const handleSaveProfile = async (
    id: string,
    updates: Parameters<typeof updateUserProfile>[1],
  ) => {
    try {
      await updateUserProfile(id, updates)
      toast({
        title: 'Usuário atualizado',
        description: 'As alterações foram salvas com sucesso.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar as alterações do usuário.',
      })
      throw new Error('update failed')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUserAsAdmin(deleteTarget.id)
      removeUserFromList(deleteTarget.id)
      toast({
        title: 'Usuário excluído',
        description: `${deleteTarget.full_name} foi removido do sistema.`,
      })
      setDeleteTarget(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível excluir o usuário. Verifique se a Edge Function admin-delete-user está publicada.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Aprovado</Badge>
        )
      case 'pending':
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/20 text-amber-700 border-amber-200"
          >
            Pendente
          </Badge>
        )
      case 'blocked':
        return <Badge variant="destructive">Bloqueado</Badge>
      case 'in_memoriam':
        return (
          <Badge variant="outline" className="border-gray-400 text-gray-600">
            In Memoriam
          </Badge>
        )
      case 'adormecido':
        return (
          <Badge variant="outline" className="border-slate-400 text-slate-600">
            Adormecido
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!canApproveUsers) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Apenas administradores do sistema ou membros da diretoria podem
        aprovar cadastros de usuários.
      </p>
    )
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
              <SelectItem value="in_memoriam">In Memoriam</SelectItem>
              <SelectItem value="adormecido">Adormecido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Funções</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="member">Membro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Grau</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum usuário encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email || 'Email não disponível'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{degreeLabel(user.masonic_degree)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabel(user.role)}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      {isSystemAdmin && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setEditUser(user)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                      )}
                      {isSystemAdmin && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8"
                        disabled={!canDeleteUser(user)}
                        onClick={() => setDeleteTarget(user)}
                        title={
                          user.id === currentUser?.id
                            ? 'Você não pode excluir sua própria conta'
                            : isMasterAdminEmail(user.email)
                              ? 'Administrador principal não pode ser excluído'
                              : 'Excluir usuário'
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isSystemAdmin && (
                            <DropdownMenuItem onClick={() => setEditUser(user)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar perfil
                            </DropdownMenuItem>
                          )}
                          {canDeleteUser(user) && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setDeleteTarget(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir usuário
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Acesso</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {user.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(user, 'approved')}
                              className="text-green-600 focus:text-green-600 focus:bg-green-50"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                              Cadastro
                            </DropdownMenuItem>
                          )}
                          {user.status === 'blocked' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(user, 'approved')}
                            >
                              <Shield className="mr-2 h-4 w-4" /> Desbloquear
                            </DropdownMenuItem>
                          )}
                          {isSystemAdmin && user.status !== 'blocked' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(user, 'blocked')}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Ban className="mr-2 h-4 w-4" /> Bloquear Acesso
                            </DropdownMenuItem>
                          )}
                          {isSystemAdmin && (
                          <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Status na Loja</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {user.status !== 'in_memoriam' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(user, 'in_memoriam')}
                              className="text-gray-600"
                            >
                              <Flower2 className="mr-2 h-4 w-4" /> Marcar In Memoriam
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'adormecido' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(user, 'adormecido')}
                              className="text-slate-600"
                            >
                              <Moon className="mr-2 h-4 w-4" /> Marcar Adormecido
                            </DropdownMenuItem>
                          )}
                          {(user.status === 'in_memoriam' ||
                            user.status === 'adormecido') && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(user, 'approved')}
                              className="text-green-600"
                            >
                              <UserX className="mr-2 h-4 w-4" /> Reativar como Aprovado
                            </DropdownMenuItem>
                          )}
                          </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserEditDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser}
        onSave={handleSaveProfile}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente a conta de{' '}
              <strong>{deleteTarget?.full_name}</strong> (
              {deleteTarget?.email || 'sem e-mail'}), incluindo login e perfil.
              Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={() => void handleConfirmDelete()}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
