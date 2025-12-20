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
import {
  MoreHorizontal,
  Search,
  Shield,
  CheckCircle,
  Ban,
  Loader2,
  Mail,
  UserCog,
} from 'lucide-react'
import { Profile } from '@/stores/useAuthStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export function UserManagement() {
  const {
    users,
    fetchUsers,
    updateUserStatus,
    updateUserRole,
    updateUserDegree,
    loading,
  } = useUserStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

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

  const handleStatusChange = async (
    user: Profile,
    newStatus: Profile['status'],
  ) => {
    try {
      await updateUserStatus(user.id, newStatus)
      toast({
        title: 'Status Atualizado',
        description: `O status de ${user.full_name} foi alterado para ${newStatus}.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
      })
    }
  }

  const handleRoleChange = async (user: Profile, newRole: Profile['role']) => {
    try {
      await updateUserRole(user.id, newRole)
      toast({
        title: 'Permissão Atualizada',
        description: `A função de ${user.full_name} foi alterada para ${newRole}.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a permissão.',
      })
    }
  }

  const handleDegreeChange = async (user: Profile, newDegree: string) => {
    try {
      await updateUserDegree(user.id, newDegree)
      toast({
        title: 'Grau Atualizado',
        description: `O grau de ${user.full_name} foi alterado para ${newDegree}.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o grau.',
      })
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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="default" className="bg-primary/80">
            Admin
          </Badge>
        )
      case 'editor':
        return <Badge variant="secondary">Editor</Badge>
      default:
        return <span className="text-sm text-muted-foreground">Membro</span>
    }
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
                    <Select
                      defaultValue={user.masonic_degree || 'Aprendiz'}
                      onValueChange={(val) => handleDegreeChange(user, val)}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                        <SelectItem value="Companheiro">Companheiro</SelectItem>
                        <SelectItem value="Mestre">Mestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        defaultValue={user.role}
                        onValueChange={(val) =>
                          handleRoleChange(user, val as any)
                        }
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                        {user.status !== 'blocked' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(user, 'blocked')}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Ban className="mr-2 h-4 w-4" /> Bloquear Acesso
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
