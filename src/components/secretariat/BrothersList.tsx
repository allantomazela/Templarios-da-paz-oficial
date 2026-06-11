import { useState, useEffect, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Brother } from '@/lib/data'
import { MoreHorizontal, Search, Plus, Eye, Pencil, Power } from 'lucide-react'
import { BrotherDialog } from './BrotherDialog'
import { BrotherDetails } from './BrotherDetails'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import {
  createBrother,
  fetchBrothers,
  toggleBrotherStatus,
  updateBrother,
  type BrotherSaveInput,
} from '@/lib/brothers-api'
import { isAuthError, getSaveErrorMessage } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'

export function BrothersList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [degreeFilter, setDegreeFilter] = useState('all')
  const [brothers, setBrothers] = useState<Brother[]>([])
  const dialog = useDialog()
  const detailsDialog = useDialog()
  const [selectedBrother, setSelectedBrother] = useState<Brother | null>(null)
  const hasLoadedRef = useRef(false)
  const { toast } = useToast()

  const loadBrothers = useAsyncOperation(
    async () => {
      const mappedBrothers = await fetchBrothers()
      setBrothers(mappedBrothers)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar irmãos.',
    },
  )

  const { execute: loadBrothersExecute, loading: loadBrothersLoading } = loadBrothers

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadBrothersExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredBrothers = brothers.filter((brother) => {
    const matchesSearch =
      brother.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brother.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || brother.status === statusFilter
    const matchesDegree =
      degreeFilter === 'all' || brother.degree === degreeFilter
    return matchesSearch && matchesStatus && matchesDegree
  })

  const saveOperation = useAsyncOperation(
    async (data: BrotherSaveInput) => {
      if (selectedBrother) {
        const updatedBrother = await updateBrother(selectedBrother.id, data)
        setBrothers((prev) =>
          prev.map((b) => (b.id === selectedBrother.id ? updatedBrother : b)),
        )
        return 'Irmão atualizado com sucesso.'
      }

      const newBrother = await createBrother(data)
      setBrothers((prev) => [newBrother, ...prev])
      return 'Irmão adicionado com sucesso.'
    },
    {
      showSuccessToast: true,
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o registro.',
      showErrorToast: false,
      onError: (error) => {
        if (isAuthError(error)) {
          useAuthStore.getState().clearSessionAndRedirectToLogin()
          return
        }
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: getSaveErrorMessage(error),
        })
      },
    },
  )

  const toggleStatusOperation = useAsyncOperation(
    async (brother: Brother) => {
      const updatedBrother = await toggleBrotherStatus(brother)
      setBrothers((prev) =>
        prev.map((b) => (b.id === brother.id ? updatedBrother : b)),
      )
      return `Status de ${brother.name} alterado para ${updatedBrother.status}.`
    },
    {
      successMessage: 'Status alterado com sucesso!',
      errorMessage: 'Falha ao alterar o status.',
    },
  )

  const handleSave = async (data: BrotherSaveInput) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
      loadBrothersExecute()
    }
  }

  const toggleStatus = (brother: Brother) => {
    toggleStatusOperation.execute(brother)
  }

  const openEdit = (brother: Brother) => {
    setSelectedBrother(brother)
    dialog.openDialog()
  }

  const openNew = () => {
    setSelectedBrother(null)
    dialog.openDialog()
  }

  const openDetails = (brother: Brother) => {
    setSelectedBrother(brother)
    detailsDialog.openDialog()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={degreeFilter} onValueChange={setDegreeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Grau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Graus</SelectItem>
                <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                <SelectItem value="Companheiro">Companheiro</SelectItem>
                <SelectItem value="Mestre">Mestre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />{' '}
          <span className="hidden sm:inline">Adicionar</span> Irmão
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Grau</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadBrothersLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando irmãos...
                </TableCell>
              </TableRow>
            ) : filteredBrothers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Nenhum irmão encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredBrothers.map((brother) => (
                <TableRow key={brother.id}>
                  <TableCell className="font-medium">{brother.name}</TableCell>
                  <TableCell>{brother.degree}</TableCell>
                  <TableCell>{brother.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        brother.status === 'Ativo' ? 'default' : 'destructive'
                      }
                      className={
                        brother.status === 'Ativo'
                          ? 'bg-green-600 hover:bg-green-700'
                          : ''
                      }
                    >
                      {brother.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openDetails(brother)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(brother)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleStatus(brother)}
                          className={
                            brother.status === 'Ativo'
                              ? 'text-destructive'
                              : 'text-green-600'
                          }
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {brother.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loadBrothersLoading ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Carregando irmãos...
          </div>
        ) : filteredBrothers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Nenhum irmão encontrado.
          </div>
        ) : (
          filteredBrothers.map((brother) => (
            <Card key={brother.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{brother.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {brother.role}
                    </p>
                  </div>
                  <Badge
                    variant={
                      brother.status === 'Ativo' ? 'default' : 'destructive'
                    }
                    className={
                      brother.status === 'Ativo'
                        ? 'bg-green-600 hover:bg-green-700 text-[10px]'
                        : 'text-[10px]'
                    }
                  >
                    {brother.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="outline" className="text-xs">
                    {brother.degree}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(brother)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(brother)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BrotherDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        brotherToEdit={selectedBrother}
        onSave={handleSave}
        isSaving={saveOperation.loading}
      />

      <BrotherDetails
        open={detailsDialog.open}
        onOpenChange={detailsDialog.onOpenChange}
        brother={selectedBrother}
      />
    </div>
  )
}
